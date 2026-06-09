import { BaseSeeder } from "./base.seeder";
import { Applicant } from "../modules/applicants/entities/applicant.entity";

export class ApplicantsSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log("🌱 Seeding applicants...");

    await this.clearTable(Applicant);

    const applicants = await this.createApplicants();

    console.log(`✅ ${applicants.length} applicants seeded successfully`);
  }

  private async createApplicants() {
    const sampleData = [
      { fullName: 'Budi Santoso',         email: 'budi.santoso@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Siti Rahayu',          email: 'siti.rahayu@yahoo.com',        gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Agus Pratama',         email: 'agus.pratama@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Dewi Kusuma',          email: 'dewi.kusuma@gmail.com',        gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Rizky Firmansyah',     email: 'rizky.firmansyah@gmail.com',   gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Nur Hidayah',          email: 'nur.hidayah@yahoo.com',        gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Eko Wahyudi',          email: 'eko.wahyudi@gmail.com',        gender: 'male',   maritalStatus: 'married'  },
      { fullName: 'Ratna Sari',           email: 'ratna.sari@gmail.com',         gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Hendra Setiawan',      email: 'hendra.setiawan@gmail.com',    gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Yuli Astuti',          email: 'yuli.astuti@yahoo.com',        gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Doni Prasetyo',        email: 'doni.prasetyo@gmail.com',      gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Fitri Handayani',      email: 'fitri.handayani@gmail.com',    gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Wahyu Nugroho',        email: 'wahyu.nugroho@gmail.com',      gender: 'male',   maritalStatus: 'married'  },
      { fullName: 'Indah Permata',        email: 'indah.permata@yahoo.com',      gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Fajar Hidayat',        email: 'fajar.hidayat@gmail.com',      gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Anisa Putri',          email: 'anisa.putri@gmail.com',        gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Bambang Suryadi',      email: 'bambang.suryadi@gmail.com',    gender: 'male',   maritalStatus: 'married'  },
      { fullName: 'Rini Wulandari',       email: 'rini.wulandari@yahoo.com',     gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Dimas Aditya',         email: 'dimas.aditya@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Maya Anggraini',       email: 'maya.anggraini@gmail.com',     gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Lutfi Hakim',          email: 'lutfi.hakim@gmail.com',        gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Sri Wahyuni',          email: 'sri.wahyuni@yahoo.com',        gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Arif Budiman',         email: 'arif.budiman@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Lestari Dewi',         email: 'lestari.dewi@gmail.com',       gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Irfan Maulana',        email: 'irfan.maulana@gmail.com',      gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Tiara Safitri',        email: 'tiara.safitri@yahoo.com',      gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Yoga Pratama',         email: 'yoga.pratama@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Novia Anggraeni',      email: 'novia.anggraeni@gmail.com',    gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Bagas Kurniawan',      email: 'bagas.kurniawan@gmail.com',    gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Putri Ramadhani',      email: 'putri.ramadhani@yahoo.com',    gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Gilang Ramadan',       email: 'gilang.ramadan@gmail.com',     gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Ayu Lestari',          email: 'ayu.lestari@gmail.com',        gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Kevin Wijaya',         email: 'kevin.wijaya@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Diana Puspita',        email: 'diana.puspita@yahoo.com',      gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Reza Fauzi',           email: 'reza.fauzi@gmail.com',         gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Hana Fitriani',        email: 'hana.fitriani@gmail.com',      gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Andre Kusuma',         email: 'andre.kusuma@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Mega Pratiwi',         email: 'mega.pratiwi@yahoo.com',       gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Hafiz Ramdhani',       email: 'hafiz.ramdhani@gmail.com',     gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Cindy Octavia',        email: 'cindy.octavia@gmail.com',      gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Rizal Firdaus',        email: 'rizal.firdaus@gmail.com',      gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Vina Amalia',          email: 'vina.amalia@yahoo.com',        gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Taufik Ismail',        email: 'taufik.ismail@gmail.com',      gender: 'male',   maritalStatus: 'married'  },
      { fullName: 'Nita Kurnia',          email: 'nita.kurnia@gmail.com',        gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Andi Saputra',         email: 'andi.saputra@gmail.com',       gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Winda Sari',           email: 'winda.sari@yahoo.com',         gender: 'female', maritalStatus: 'married'  },
      { fullName: 'Fandi Akbar',          email: 'fandi.akbar@gmail.com',        gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Laras Kinanti',        email: 'laras.kinanti@gmail.com',      gender: 'female', maritalStatus: 'single'   },
      { fullName: 'Galih Prabowo',        email: 'galih.prabowo@gmail.com',      gender: 'male',   maritalStatus: 'single'   },
      { fullName: 'Shinta Dewi',          email: 'shinta.dewi@yahoo.com',        gender: 'female', maritalStatus: 'married'  },
    ];

    const applicantData = sampleData.map((d, i) => ({
      id: this.generateId(),
      fullName: d.fullName,
      email: d.email,
      phone: `+6281${String(10000000 + i * 1234567).slice(0, 8)}`,
      photoUrl: `https://i.pravatar.cc/150?u=${i + 1}`,
      dateOfBirth: new Date(1988 + (i % 12), i % 12, (i % 28) + 1),
      gender: d.gender,
      maritalStatus: d.maritalStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return await this.saveEntities(Applicant, applicantData);
  }
}
