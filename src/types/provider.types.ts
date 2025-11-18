// OpenMRS Provider, Person, and User types based on the actual API response

export interface PersonName {
  uuid: string;
  display: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  preferred: boolean;
}

export interface PersonAttribute {
  uuid: string;
  display: string;
  value: string;
  attributeType: {
    uuid: string;
    display: string;
    name: string;
  };
}

export interface Person {
  uuid: string;
  display: string;
  gender: string;
  age?: number;
  birthdate?: string;
  birthdateEstimated?: boolean;
  dead?: boolean;
  deathDate?: string;
  causeOfDeath?: string;
  preferredName?: PersonName;
  names?: PersonName[];
  attributes?: PersonAttribute[];
}

export interface ProviderAttribute {
  uuid: string;
  display: string;
  value: string;
  attributeType: {
    uuid: string;
    display: string;
    name: string;
    description?: string;
  };
  voided?: boolean;
}

export interface Provider {
  uuid: string;
  display: string;
  identifier: string;
  person: Person;
  attributes?: ProviderAttribute[];
  retired?: boolean;
}

export interface Privilege {
  uuid: string;
  display: string;
  name: string;
  description?: string;
}

export interface Role {
  uuid: string;
  display: string;
  name: string;
  description?: string;
  privileges?: Privilege[];
}

export interface UserProperty {
  [key: string]: string;
}

export interface User {
  uuid: string;
  display: string;
  username: string;
  systemId: string;
  userProperties: UserProperty;
  person: Person;
  privileges: Privilege[];
  roles: Role[];
  retired?: boolean;
}

// Response types for API calls
export interface ProviderResponse {
  results: Provider[];
}

export interface ProviderDetailResponse extends Provider {}

export interface PersonDetailResponse extends Person {}

export interface UserDetailResponse extends User {}

// Mapped profile data for application use
export interface HealthWorkerProfile {
  // User information
  userUuid: string;
  username: string;
  systemId: string;
  display: string;

  // Person information
  personUuid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: string;
  age?: number;
  dateOfBirth?: string;
  birthdateEstimated?: boolean;

  // Provider information
  providerUuid?: string;
  providerIdentifier?: string;

  // Provider attributes (custom fields)
  attributes: {
    [key: string]: string;
  };

  // Person attributes
  personAttributes: {
    [key: string]: string;
  };

  // Roles and privileges
  roles: string[];
  privileges: string[];
  hasPrivilege: (privilegeName: string) => boolean;
  hasRole: (roleName: string) => boolean;

  // Profile image
  avatar?: string;

  // Additional metadata
  isActive: boolean;
  userProperties: UserProperty;
}
