import { BaseSeeder } from "./base.seeder";
import { Applicant } from "../modules/applicants/entities/applicant.entity";

export class ApplicantsSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding applicants...");

    // Clear existing data
    await this.clearTable(Applicant);

    // Create sample applicants
    const applicants = await this.createApplicants();

    console.log(`✅ ${applicants.length} applicants seeded successfully`);
  }

  private async createApplicants() {
    const sampleNames = [
      'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Wilson', 'David Brown',
      'Emily Davis', 'Robert Garcia', 'Lisa Rodriguez', 'William Anderson', 'Maria Lopez',
      'James Taylor', 'Jennifer Martinez', 'Christopher Lee', 'Amanda White', 'Daniel Harris',
      'Ashley Clark', 'Matthew Lewis', 'Jessica Walker', 'Andrew Hall', 'Stephanie Young',
      'Joshua Allen', 'Nicole King', 'Ryan Wright', 'Samantha Scott', 'Kevin Green',
      'Rachel Adams', 'Brandon Baker', 'Lauren Nelson', 'Justin Carter', 'Megan Mitchell',
      'Tyler Moore', 'Brittany Jackson', 'Zachary Martin', 'Kayla Thompson', 'Nathan Garcia',
      'Samantha Martinez', 'Jacob Robinson', 'Megan Clark', 'Brandon Rodriguez', 'Lauren Lewis',
      'Justin Lee', 'Stephanie Walker', 'Joshua Hall', 'Nicole Allen', 'Ryan Young',
      'Ashley King', 'Matthew Wright', 'Jessica Scott', 'Andrew Green', 'Maria Adams'
    ];

    const applicantData: any[] = [];

    for (let i = 0; i < 50; i++) {
      const applicant = {
        id: this.generateId(),
        fullName: sampleNames[i],
        email: `${sampleNames[i].toLowerCase().replace(' ', '.')}@example.com`,
        phone: `+6281${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        photoUrl: `https://i.pravatar.cc/150?u=${i + 1}`,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        address: `Jl. Example Street No. ${i + 1}, Jakarta`,
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: `10${String(Math.floor(Math.random() * 900) + 100)}`,
        country: 'Indonesia',
        nationality: 'Indonesian',
        maritalStatus: Math.random() > 0.7 ? 'married' : 'single',
        religion: ['Islam', 'Christian', 'Catholic', 'Hindu', 'Buddhist'][Math.floor(Math.random() * 5)],
        emergencyContactName: `Emergency Contact ${i + 1}`,
        emergencyContactPhone: `+6281${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        emergencyContactRelationship: ['Parent', 'Spouse', 'Sibling', 'Friend'][Math.floor(Math.random() * 4)],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      applicantData.push(applicant);
    }

    return await this.saveEntities(Applicant, applicantData);
  }
}
