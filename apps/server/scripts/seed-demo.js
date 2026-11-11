import { prisma } from '../src/db.js';
import { hashPassword } from '../src/lib/auth.js';

const demoPassword = 'CrewensiaDemo2026!';
const passwordHash = await hashPassword(demoPassword);

async function user(email, name, phone, roles, activeRole) {
  return prisma.user.upsert({
    where: { email },
    update: { name, phone, roles, activeRole, passwordHash, accountStatus: 'ACTIVE' },
    create: { email, name, phone, roles, activeRole, passwordHash, emailVerifiedAt: new Date() },
  });
}

const volunteer = await user('demo.volunteer@crewensia.test', 'Aarav Volunteer', '+91 90000 00001', ['VOLUNTEER'], 'VOLUNTEER');
await prisma.volunteerProfile.upsert({
  where: { userId: volunteer.id },
  update: { homeCity: 'Bhubaneswar', locality: 'Saheed Nagar', skills: ['Event support', 'Photography'] },
  create: { userId: volunteer.id, homeCity: 'Bhubaneswar', locality: 'Saheed Nagar', skills: ['Event support', 'Photography'] },
});

const admin = await user('demo.admin@crewensia.test', 'Crewensia Admin', '+91 90000 00002', ['ADMIN'], 'ADMIN');

const approvedOrganizer = await user('demo.organizer@crewensia.test', 'Maya Rao', '+91 90000 00003', ['ORGANIZER'], 'ORGANIZER');
const approvedProfile = await prisma.organizerProfile.upsert({
  where: { userId: approvedOrganizer.id },
  update: { organizationName: 'Community Table Bhubaneswar', verificationStatus: 'APPROVED' },
  create: { userId: approvedOrganizer.id, organizationName: 'Community Table Bhubaneswar', verificationStatus: 'APPROVED' },
});

const pendingOrganizer = await user('demo.pending@crewensia.test', 'Nisha Community', '+91 90000 00004', ['ORGANIZER'], 'ORGANIZER');
const pendingProfile = await prisma.organizerProfile.upsert({
  where: { userId: pendingOrganizer.id },
  update: { organizationName: 'Green Neighbourhood Collective', verificationStatus: 'PENDING' },
  create: { userId: pendingOrganizer.id, organizationName: 'Green Neighbourhood Collective', verificationStatus: 'PENDING' },
});
const openRequest = await prisma.verificationRequest.findFirst({ where: { organizerId: pendingProfile.id, status: 'PENDING' } });
if (!openRequest) {
  await prisma.verificationRequest.create({
    data: {
      organizerId: pendingProfile.id,
      credentialType: 'NGO registration certificate',
      credentialDetails: 'Registered community organization working on neighbourhood cleanups and urban gardening. Registration ID: OD/NGO/2024/08421. Primary contact: Nisha Community, +91 90000 00004.',
      documentReference: 'Demo document reference (sample only)',
    },
  });
}

let event = await prisma.event.findFirst({ where: { organizerId: approvedProfile.id, title: { in: ['Bengaluru Community Garden Day', 'Bhubaneswar Community Garden Day'] } } });
if (!event) {
  const startsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(4, 30, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
  const applicationDeadline = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);
  event = await prisma.event.create({
    data: {
      organizerId: approvedProfile.id,
      title: 'Bhubaneswar Community Garden Day',
      description: 'Join neighbours for a welcoming morning of planting, composting, and restoring a shared community garden. No gardening experience is needed. Tools, gloves, water, and a short orientation will be provided.',
      category: 'Environment',
      venueName: 'Saheed Nagar Community Garden',
      venueAddress: 'Saheed Nagar, Bhubaneswar, Odisha',
      locality: 'Saheed Nagar',
      city: 'Bhubaneswar',
      startsAt,
      endsAt,
      applicationDeadline,
      eligibility: 'Open to volunteers aged 18 and above. Comfortable clothes recommended.',
      benefits: 'Refreshments, gardening supplies, and a community participation certificate.',
      dressCode: 'Comfortable clothes and closed-toe shoes.',
      arrivalInstructions: 'Meet at the garden entrance beside the community library. Ask for Maya.',
      otherConditions: 'This is an outdoor event; activities may shift in case of heavy rain.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      roles: {
        create: [
          {
            title: 'Garden Support Volunteer',
            responsibilities: 'Help prepare planting beds, plant saplings, sort compost, and welcome participants.',
            requiredSkills: ['Teamwork', 'Gardening'],
            compensationType: 'UNPAID',
            shifts: { create: [{ startsAt, endsAt, openings: 12 }] },
          },
        ],
      },
    },
  });
} else {
  event = await prisma.event.update({
    where: { id: event.id },
    data: {
      title: 'Bhubaneswar Community Garden Day',
      description: 'Join neighbours for a welcoming morning of planting, composting, and restoring a shared community garden. No gardening experience is needed. Tools, gloves, water, and a short orientation will be provided.',
      category: 'Environment',
      venueName: 'Saheed Nagar Community Garden',
      venueAddress: 'Saheed Nagar, Bhubaneswar, Odisha',
      locality: 'Saheed Nagar',
      city: 'Bhubaneswar',
    },
  });
}

const demoShift = await prisma.eventShift.findFirst({
  where: { eventRole: { eventId: event.id } },
  orderBy: { startsAt: 'asc' },
});
const demoApplication = demoShift ? await prisma.application.upsert({
  where: { eventShiftId_volunteerId: { eventShiftId: demoShift.id, volunteerId: volunteer.id } },
  update: { message: 'I would love to help with the garden and meet other volunteers.' },
  create: {
    eventShiftId: demoShift.id,
    volunteerId: volunteer.id,
    message: 'I would love to help with the garden and meet other volunteers.',
    statusHistory: { create: { fromStatus: null, toStatus: 'PENDING', changedById: volunteer.id } },
  },
}) : null;

console.log(JSON.stringify({
  seeded: true,
  password: demoPassword,
  accounts: [
    { role: 'ADMIN', email: admin.email },
    { role: 'VOLUNTEER', email: volunteer.email },
    { role: 'APPROVED ORGANIZER', email: approvedOrganizer.email },
    { role: 'PENDING ORGANIZER', email: pendingOrganizer.email },
  ],
  event: { id: event.id, title: event.title, city: event.city },
  application: demoApplication ? { id: demoApplication.id, status: demoApplication.status, volunteer: volunteer.email } : null,
}, null, 2));

await prisma.$disconnect();
