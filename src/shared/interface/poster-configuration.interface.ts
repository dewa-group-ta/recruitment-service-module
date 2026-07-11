/**
 * konfigurasi field mana saja yang ditampilkan di poster lowongan yang di-generate.
 */
export interface PosterConfiguration {
  jobDetails: {
    dueDate: boolean;
    jobTitle: boolean;
    jobType: boolean;
    applicantLimit: boolean;
  };
  employmentDetails: {
    employmentType: boolean;
    category: boolean;
    education: boolean;
    experience: boolean;
  };
  jobOverview: {
    description: boolean;
    responsibilities: boolean;
    requirements: boolean;
  };
  locations: {
    locations: boolean;
  };
  workModel: {
    workModel: boolean;
  };
  salary: {
    salary: boolean;
  };
}

/**
 * konfigurasi default poster, semua field aktif.
 */
export const DEFAULT_POSTER_CONFIGURATION: PosterConfiguration = {
  jobDetails: {
    dueDate: true,
    jobTitle: true,
    jobType: true,
    applicantLimit: true
  },
  employmentDetails: {
    employmentType: true,
    category: true,
    education: true,
    experience: true
  },
  jobOverview: {
    description: true,
    responsibilities: true,
    requirements: true
  },
  locations: {
    locations: true
  },
  workModel: {
    workModel: true
  },
  salary: {
    salary: true
  }
};
