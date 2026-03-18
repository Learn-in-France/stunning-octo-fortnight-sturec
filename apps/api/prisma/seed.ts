import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sturec.com' },
    update: {},
    create: {
      firebaseUid: 'firebase-admin-placeholder',
      email: 'admin@sturec.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
    },
  })

  // Counsellor user
  const counsellor = await prisma.user.upsert({
    where: { email: 'counsellor@sturec.com' },
    update: {},
    create: {
      firebaseUid: 'firebase-counsellor-placeholder',
      email: 'counsellor@sturec.com',
      role: 'counsellor',
      firstName: 'Sarah',
      lastName: 'Counsellor',
      status: 'active',
    },
  })

  // Universities
  const parisUniversity = await prisma.university.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Université Paris-Saclay',
      city: 'Paris',
      country: 'France',
      websiteUrl: 'https://www.universite-paris-saclay.fr',
      partnerStatus: 'active_partner',
      active: true,
      createdBy: admin.id,
    },
  })

  const lyonUniversity = await prisma.university.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Université de Lyon',
      city: 'Lyon',
      country: 'France',
      websiteUrl: 'https://www.universite-lyon.fr',
      partnerStatus: 'prospective',
      active: true,
      createdBy: admin.id,
    },
  })

  // Programs
  const program1 = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      universityId: parisUniversity.id,
      name: 'MSc Data Science',
      degreeLevel: 'Masters',
      fieldOfStudy: 'Computer Science',
      language: 'English',
      durationMonths: 24,
      tuitionAmount: 8500,
      tuitionCurrency: 'EUR',
      minimumGpa: 3.0,
      englishRequirementType: 'ielts',
      englishMinimumScore: 6.5,
      description: 'Two-year master program in Data Science with focus on AI and machine learning.',
      active: true,
      createdBy: admin.id,
    },
  })

  const program2 = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      universityId: parisUniversity.id,
      name: 'MSc International Business',
      degreeLevel: 'Masters',
      fieldOfStudy: 'Business',
      language: 'English',
      durationMonths: 18,
      tuitionAmount: 12000,
      tuitionCurrency: 'EUR',
      minimumGpa: 2.8,
      description: 'International business program with semester abroad option.',
      active: true,
      createdBy: admin.id,
    },
  })

  const program3 = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      universityId: lyonUniversity.id,
      name: 'BSc Computer Engineering',
      degreeLevel: 'Bachelors',
      fieldOfStudy: 'Engineering',
      language: 'English',
      durationMonths: 36,
      tuitionAmount: 5000,
      tuitionCurrency: 'EUR',
      description: 'Undergraduate program in computer engineering.',
      active: true,
      createdBy: admin.id,
    },
  })

  // Intakes (2 per program)
  for (const program of [program1, program2, program3]) {
    await prisma.programIntake.upsert({
      where: { id: `${program.id.slice(0, -2)}a1` },
      update: {},
      create: {
        id: `${program.id.slice(0, -2)}a1`,
        programId: program.id,
        intakeName: 'September 2026',
        startMonth: 9,
        startYear: 2026,
        applicationDeadline: new Date('2026-05-15'),
        active: true,
        createdBy: admin.id,
      },
    })

    await prisma.programIntake.upsert({
      where: { id: `${program.id.slice(0, -2)}a2` },
      update: {},
      create: {
        id: `${program.id.slice(0, -2)}a2`,
        programId: program.id,
        intakeName: 'February 2027',
        startMonth: 2,
        startYear: 2027,
        applicationDeadline: new Date('2026-10-15'),
        active: true,
        createdBy: admin.id,
      },
    })
  }

  // Visa requirements
  await prisma.visaRequirement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      title: 'Valid Passport',
      description: 'Must have a valid passport with at least 6 months validity beyond intended stay.',
      documentType: 'passport',
      required: true,
      sortOrder: 1,
      createdBy: admin.id,
    },
  })

  await prisma.visaRequirement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      title: 'Financial Proof',
      description: 'Bank statements or sponsor letter showing sufficient funds for duration of study.',
      documentType: 'financial_proof',
      required: true,
      sortOrder: 2,
      createdBy: admin.id,
    },
  })

  // Eligibility rule
  await prisma.eligibilityRule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000030' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000030',
      programId: program1.id,
      ruleName: 'Minimum GPA',
      field: 'gpa',
      operator: 'gte',
      value: '3.0',
      valueType: 'number',
      description: 'Minimum GPA of 3.0 required for MSc Data Science.',
      createdBy: admin.id,
    },
  })

  // Campus France prep item
  await prisma.campusFrancePrep.upsert({
    where: { id: '00000000-0000-0000-0000-000000000040' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000040',
      title: 'Study Plan / Motivation',
      content: 'Prepare a clear explanation of why you chose France and your specific program. Focus on career goals and how the program aligns.',
      category: 'interview_prep',
      sortOrder: 1,
      active: true,
      createdBy: admin.id,
    },
  })

  console.log('Seed completed successfully')
  console.log(`  Admin: ${admin.email} (${admin.id})`)
  console.log(`  Counsellor: ${counsellor.email} (${counsellor.id})`)
  console.log(`  Universities: ${parisUniversity.name}, ${lyonUniversity.name}`)
  console.log(`  Programs: ${program1.name}, ${program2.name}, ${program3.name}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
