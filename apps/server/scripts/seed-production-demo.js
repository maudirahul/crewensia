import { randomBytes } from 'node:crypto';
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/lib/auth.js';

if (process.env.NODE_ENV !== 'production' || process.env.CREWENSIA_ENABLE_PRODUCTION_DEMO_SEED !== 'true') {
  throw new Error('Production demo seed is disabled. Set NODE_ENV=production and CREWENSIA_ENABLE_PRODUCTION_DEMO_SEED=true to run it.');
}

const organizationName = 'Community Table Bhubaneswar';
const eventTitle = 'DEMO ONLY — Community Garden Day (do not attend)';

async function findOrCreateDemoUser(tx, { email, name, roles, activeRole }) {
  const existing = await tx.user.findUnique({ where: { email } });
  if (existing) {
    const acceptedNames = email === 'demo.organizer@crewensia.test'
      ? new Set(['Maya Rao', 'Crewensia Demo Organizer'])
      : new Set([name]);
    if (!acceptedNames.has(existing.name) || !existing.roles.includes(activeRole) || !email.endsWith('@crewensia.test')) {
      throw new Error(`Refusing to modify existing account ${email}.`);
    }
    return existing;
  }

  return tx.user.create({
    data: {
      email,
      name,
      roles,
      activeRole,
      // No demo password is issued or saved. This random hash cannot be used to sign in.
      passwordHash: await hashPassword(randomBytes(48).toString('base64url')),
    },
  });
}

function futureSchedule() {
  const startsAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(4, 30, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
  const applicationDeadline = new Date(startsAt.getTime() - 48 * 60 * 60 * 1000);
  return { startsAt, endsAt, applicationDeadline };
}

try {
  const result = await prisma.$transaction(async (tx) => {
    const organizerUser = await findOrCreateDemoUser(tx, {
      email: 'demo.organizer@crewensia.test',
      name: 'Maya Rao',
      roles: ['ORGANIZER'],
      activeRole: 'ORGANIZER',
    });
    let organizer = await tx.organizerProfile.findUnique({ where: { userId: organizerUser.id } });
    if (!organizer) {
      organizer = await tx.organizerProfile.create({
        data: { userId: organizerUser.id, organizationName, verificationStatus: 'APPROVED' },
      });
    } else if (organizer.organizationName !== organizationName || organizer.verificationStatus !== 'APPROVED') {
      throw new Error('Existing demo organizer profile does not match the expected sample profile; refusing to change it.');
    }

    const existingEvent = await tx.event.findFirst({ where: { organizerId: organizer.id, title: eventTitle } });
    let event = existingEvent;
    if (!event) {
      const { startsAt, endsAt, applicationDeadline } = futureSchedule();
      event = await tx.event.create({
        data: {
          organizerId: organizer.id,
          title: eventTitle,
          description: 'This is fictional sample data created for Crewensia production review. There is no real event, venue, organizer, or volunteer activity. Please do not travel to or attend this listing.',
          category: 'Demo data',
          venueName: 'Fictional sample venue',
          venueAddress: 'Bhubaneswar (sample location only; no physical venue)',
          locality: 'Demo location',
          city: 'Bhubaneswar',
          startsAt,
          endsAt,
          applicationDeadline,
          eligibility: 'Sample data only; this is not a real event.',
          benefits: 'None; this listing is only for software review.',
          arrivalInstructions: 'Do not attend. This event does not take place.',
          otherConditions: 'Fictional demonstration listing. No real organizer or event.',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          roles: {
            create: [{
              title: 'Demo event support volunteer',
              responsibilities: 'Sample role for checking the admin event and application view. No work is being offered.',
              requiredSkills: ['Sample data'],
              compensationType: 'UNPAID',
              shifts: { create: [{ startsAt, endsAt, openings: 5 }] },
            }],
          },
        },
        include: { roles: { include: { shifts: true } } },
      });
    }

    const shift = await tx.eventShift.findFirst({
      where: { eventRole: { eventId: event.id } },
      orderBy: { startsAt: 'asc' },
    });
    if (!shift) throw new Error('Demo event exists but has no shift; refusing to modify it.');

    const applicants = [
      { name: 'Demo Volunteer One', email: 'demo.volunteer.one@crewensia.test', locality: 'Saheed Nagar', skills: ['Event support', 'Registration'], status: 'PENDING' },
      { name: 'Demo Volunteer Two', email: 'demo.volunteer.two@crewensia.test', locality: 'Patia', skills: ['Photography', 'Teamwork'], status: 'APPROVED' },
      { name: 'Demo Volunteer Three', email: 'demo.volunteer.three@crewensia.test', locality: 'Unit 4', skills: ['Setup', 'Guest welcome'], status: 'WAITLISTED' },
    ];

    for (const applicant of applicants) {
      const volunteer = await findOrCreateDemoUser(tx, {
        email: applicant.email,
        name: applicant.name,
        roles: ['VOLUNTEER'],
        activeRole: 'VOLUNTEER',
      });
      const profile = await tx.volunteerProfile.findUnique({ where: { userId: volunteer.id } });
      if (!profile) {
        await tx.volunteerProfile.create({
          data: { userId: volunteer.id, homeCity: 'Bhubaneswar', locality: applicant.locality, skills: applicant.skills },
        });
      } else if (profile.homeCity !== 'Bhubaneswar' || profile.locality !== applicant.locality) {
        throw new Error(`Existing demo profile for ${applicant.email} does not match; refusing to change it.`);
      }

      const existingApplication = await tx.application.findUnique({
        where: { eventShiftId_volunteerId: { eventShiftId: shift.id, volunteerId: volunteer.id } },
      });
      if (!existingApplication) {
        const decided = applicant.status !== 'PENDING';
        await tx.application.create({
          data: {
            eventShiftId: shift.id,
            volunteerId: volunteer.id,
            status: applicant.status,
            message: 'Fictional application for testing the admin panel. This person and application are sample data only.',
            decidedById: decided ? organizerUser.id : null,
            decidedAt: decided ? new Date() : null,
            statusHistory: {
              create: {
                fromStatus: null,
                toStatus: applicant.status,
                changedById: decided ? organizerUser.id : volunteer.id,
                note: 'Sample application created for production UI review.',
              },
            },
          },
        });
      }
    }

    return { eventId: event.id, title: event.title, applicantCount: applicants.length };
  }, { isolationLevel: 'Serializable' });

  console.log(JSON.stringify({ seeded: true, ...result }, null, 2));
} finally {
  await prisma.$disconnect();
}
