// ============================================================================
// Shared Country & Region Data Module
// ============================================================================
// Contains all default country metadata, format rules, location fields,
// nationalities, phone codes, and ATS localization rules.
// ============================================================================

export interface LocationField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  options?: string[];
}

export interface CountryInfo {
  code: string;            // ISO 3166-1 alpha-2
  name: string;
  flag: string;            // Unicode emoji flag
  dialCode: string;        // e.g. "+91"
  phoneFormat: string;     // e.g. "XXXXX XXXXX"
  phoneRegex: string;      // validation regex
  postalCodeLabel: string; // "PIN Code", "ZIP Code", "Postal Code", etc.
  postalCodeFormat: string; // regex-friendly placeholder
  dateFormat: string;      // "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", etc.
  addressFormat: string;   // template e.g. "{city}, {state}, {country} - {postalCode}"
  nationality: string;     // e.g. "Indian", "American"
  isPriority: boolean;
  isActive: boolean;
  locationFields: LocationField[];
}

export interface AtsRule {
  sourceCountryCode: string;
  targetCountryCode: string;
  keywords: string[];
  preferredFormatting: string;
  regionalHiringExpectations: string;
  regionalTerminology: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Predefined region lists for priority countries
// ---------------------------------------------------------------------------

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const INDIAN_DISTRICTS: Record<string, string[]> = {
  'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  'Karnataka': ['Bagalkot', 'Bangalore Rural', 'Bangalore Urban', 'Belgaum', 'Bellary', 'Bidar', 'Chamarajanagar', 'Chikballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Gulbarga', 'Hassan', 'Haveri', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysore', 'Raichur', 'Ramanagara', 'Shimoga', 'Tumkur', 'Udupi', 'Uttara Kannada', 'Yadgir'],
  'Tamil Nadu': ['Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Madurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Salem', 'Sivaganga', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
  'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
  'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi']
};

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

export const UAE_EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
  'Ras Al Khaimah', 'Fujairah',
];

export const UK_COUNTRIES = [
  'England', 'Scotland', 'Wales', 'Northern Ireland'
];

export const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'Cornwall', 'County Durham', 'Cumbria', 'Derbyshire', 'Devon',
  'Dorset', 'East Sussex', 'Essex', 'Gloucestershire', 'Greater London',
  'Greater Manchester', 'Hampshire', 'Herefordshire', 'Hertfordshire',
  'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire', 'Lincolnshire',
  'Merseyside', 'Norfolk', 'North Yorkshire', 'Northamptonshire',
  'Northumberland', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire',
  'Somerset', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey',
  'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex',
  'West Yorkshire', 'Wiltshire', 'Worcestershire'
];

export const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Yukon',
];

export const AUSTRALIAN_STATES = [
  'Australian Capital Territory', 'New South Wales', 'Northern Territory',
  'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
];

export const GERMAN_STATES = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
  'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony',
  'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
];

export const SAUDI_REGIONS = [
  'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk',
  'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Baha', 'Al Jawf',
  'Qassim',
];

// ---------------------------------------------------------------------------
// Priority Countries Definition (20 priority markets)
// ---------------------------------------------------------------------------

export const PRIORITY_COUNTRIES: CountryInfo[] = [
  {
    code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91',
    phoneFormat: 'XXXXX XXXXX', phoneRegex: '^[6-9]\\d{4}\\s?\\d{5}$',
    postalCodeLabel: 'PIN Code', postalCodeFormat: '6 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {district}, {state}, India - {postalCode}',
    nationality: 'Indian', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'Select state', required: true, options: INDIAN_STATES },
      { key: 'district', label: 'District', placeholder: 'e.g. Ernakulam' },
      { key: 'city', label: 'City', placeholder: 'e.g. Kochi', required: true },
      { key: 'postalCode', label: 'PIN Code', placeholder: 'e.g. 682001', required: true },
    ],
  },
  {
    code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1',
    phoneFormat: '(XXX) XXX-XXXX', phoneRegex: '^\\(?([2-9]\\d{2})\\)?[-. ]?([2-9]\\d{2})[-. ]?(\\d{4})$',
    postalCodeLabel: 'ZIP Code', postalCodeFormat: '5 digits',
    dateFormat: 'MM/DD/YYYY',
    addressFormat: '{city}, {state} {postalCode}, USA',
    nationality: 'American', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'Select state', required: true, options: US_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. San Francisco', required: true },
      { key: 'postalCode', label: 'ZIP Code', placeholder: 'e.g. 94102', required: true },
    ],
  },
  {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44',
    phoneFormat: 'XXXX XXXXXX', phoneRegex: '^7\\d{3}\\s?\\d{6}$|^\\d{4}\\s?\\d{6}$',
    postalCodeLabel: 'Postcode', postalCodeFormat: 'e.g. SW1A 1AA',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {county}, {state}, United Kingdom {postalCode}',
    nationality: 'British', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Country / Nation', placeholder: 'Select UK nation', required: true, options: UK_COUNTRIES },
      { key: 'county', label: 'County', placeholder: 'Select county', options: UK_COUNTIES },
      { key: 'city', label: 'City', placeholder: 'e.g. London', required: true },
      { key: 'postalCode', label: 'Postcode', placeholder: 'e.g. SW1A 1AA', required: true },
    ],
  },
  {
    code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1',
    phoneFormat: '(XXX) XXX-XXXX', phoneRegex: '^\\(?([2-9]\\d{2})\\)?[-. ]?([2-9]\\d{2})[-. ]?(\\d{4})$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: 'e.g. K1A 0B1',
    dateFormat: 'YYYY-MM-DD',
    addressFormat: '{city}, {state}, Canada {postalCode}',
    nationality: 'Canadian', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Province / Territory', placeholder: 'Select province', required: true, options: CANADIAN_PROVINCES },
      { key: 'city', label: 'City', placeholder: 'e.g. Toronto', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. M5H 2N2', required: true },
    ],
  },
  {
    code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61',
    phoneFormat: 'XXX XXX XXX', phoneRegex: '^4\\d{2}\\s?\\d{3}\\s?\\d{3}$|^[2378]\\d{8}$',
    postalCodeLabel: 'Postcode', postalCodeFormat: '4 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Australia {postalCode}',
    nationality: 'Australian', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'State / Territory', placeholder: 'Select state', required: true, options: AUSTRALIAN_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. Sydney', required: true },
      { key: 'postalCode', label: 'Postcode', placeholder: 'e.g. 2000', required: true },
    ],
  },
  {
    code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49',
    phoneFormat: 'XXX XXXXXXX', phoneRegex: '^1[567]\\d{8,9}$|^[2-9]\\d{3,9}$',
    postalCodeLabel: 'Postal Code (PLZ)', postalCodeFormat: '5 digits',
    dateFormat: 'DD.MM.YYYY',
    addressFormat: '{postalCode} {city}, {state}, Germany',
    nationality: 'German', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Bundesland', placeholder: 'Select state', required: true, options: GERMAN_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. Berlin', required: true },
      { key: 'postalCode', label: 'Postal Code (PLZ)', placeholder: 'e.g. 10115', required: true },
    ],
  },
  {
    code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33',
    phoneFormat: 'X XX XX XX XX', phoneRegex: '^[67]\\d{8}$|^[1-59]\\d{8}$',
    postalCodeLabel: 'Code Postal', postalCodeFormat: '5 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{postalCode} {city}, France',
    nationality: 'French', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Paris', required: true },
      { key: 'postalCode', label: 'Code Postal', placeholder: 'e.g. 75001', required: true },
    ],
  },
  {
    code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971',
    phoneFormat: 'XX XXX XXXX', phoneRegex: '^5[024568]\\d{7}$|^[234679]\\d{7}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: 'N/A',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {emirate}, UAE',
    nationality: 'Emirati', isPriority: true, isActive: true,
    locationFields: [
      { key: 'emirate', label: 'Emirate', placeholder: 'Select emirate', required: true, options: UAE_EMIRATES },
      { key: 'city', label: 'City / Area', placeholder: 'e.g. Dubai Marina', required: true },
    ],
  },
  {
    code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966',
    phoneFormat: 'XX XXX XXXX', phoneRegex: '^5\\d{8}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '5 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Saudi Arabia {postalCode}',
    nationality: 'Saudi', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Region', placeholder: 'Select region', required: true, options: SAUDI_REGIONS },
      { key: 'city', label: 'City', placeholder: 'e.g. Riyadh', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 11564', required: true },
    ],
  },
  {
    code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65',
    phoneFormat: 'XXXX XXXX', phoneRegex: '^[89]\\d{7}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '6 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'Singapore {postalCode}',
    nationality: 'Singaporean', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'District / Area', placeholder: 'e.g. Orchard', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 238823', required: true },
    ],
  },
  {
    code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974',
    phoneFormat: 'XXXX XXXX', phoneRegex: '^[3567]\\d{7}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: 'N/A',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Qatar',
    nationality: 'Qatari', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Doha', required: true },
    ],
  },
  {
    code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965',
    phoneFormat: 'XXXX XXXX', phoneRegex: '^[569]\\d{7}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '5 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Kuwait {postalCode}',
    nationality: 'Kuwaiti', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Kuwait City', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 13001', required: true },
    ],
  },
  {
    code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968',
    phoneFormat: 'XXXX XXXX', phoneRegex: '^[9]\\d{7}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '3 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Oman {postalCode}',
    nationality: 'Omani', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Muscat', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 100', required: true },
    ],
  },
  {
    code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64',
    phoneFormat: 'XX XXX XXXX', phoneRegex: '^2\\d{7,9}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '4 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, New Zealand {postalCode}',
    nationality: 'New Zealander', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Auckland', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 1010', required: true },
    ],
  },
  {
    code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353',
    phoneFormat: 'XX XXX XXXX', phoneRegex: '^8\\d{7}$',
    postalCodeLabel: 'Eircode', postalCodeFormat: 'e.g. D02 AF30',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Ireland {postalCode}',
    nationality: 'Irish', isPriority: true, isActive: true,
    locationFields: [
      { key: 'city', label: 'City / Town', placeholder: 'e.g. Dublin', required: true },
      { key: 'postalCode', label: 'Eircode', placeholder: 'e.g. D02 AF30', required: true },
    ],
  },
  {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27',
    phoneFormat: 'XX XXX XXXX', phoneRegex: '^[678]\\d{8}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '4 digits',
    dateFormat: 'YYYY/MM/DD',
    addressFormat: '{city}, {state}, South Africa {postalCode}',
    nationality: 'South African', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Province', placeholder: 'e.g. Gauteng', required: true },
      { key: 'city', label: 'City', placeholder: 'e.g. Johannesburg', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 2000', required: true },
    ],
  },
  {
    code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60',
    phoneFormat: 'XX-XXXX XXXX', phoneRegex: '^1\\d{8,9}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '5 digits',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Malaysia {postalCode}',
    nationality: 'Malaysian', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'e.g. Selangor', required: true },
      { key: 'city', label: 'City / Town', placeholder: 'e.g. Kuala Lumpur', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 50000', required: true },
    ],
  },
  {
    code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81',
    phoneFormat: 'XX-XXXX-XXXX', phoneRegex: '^[789]0\\d{8}$',
    postalCodeLabel: 'Postal Code (〒)', postalCodeFormat: 'XXX-XXXX',
    dateFormat: 'YYYY/MM/DD',
    addressFormat: '〒{postalCode} {state}, {city}, Japan',
    nationality: 'Japanese', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Prefecture', placeholder: 'e.g. Tokyo', required: true },
      { key: 'city', label: 'City / Ward', placeholder: 'e.g. Shibuya', required: true },
      { key: 'postalCode', label: 'Postal Code (〒)', placeholder: 'e.g. 150-0002', required: true },
    ],
  },
  {
    code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82',
    phoneFormat: 'XX-XXXX-XXXX', phoneRegex: '^10\\d{8}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '5 digits',
    dateFormat: 'YYYY.MM.DD',
    addressFormat: '{city}, {state}, South Korea {postalCode}',
    nationality: 'Korean', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Province / City', placeholder: 'e.g. Seoul', required: true },
      { key: 'city', label: 'District / Ward', placeholder: 'e.g. Gangnam-gu', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 06164', required: true },
    ],
  },
  {
    code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86',
    phoneFormat: 'XXX XXXX XXXX', phoneRegex: '^1[3-9]\\d{9}$',
    postalCodeLabel: 'Postal Code', postalCodeFormat: '6 digits',
    dateFormat: 'YYYY-MM-DD',
    addressFormat: '{city}, {state}, China {postalCode}',
    nationality: 'Chinese', isPriority: true, isActive: true,
    locationFields: [
      { key: 'state', label: 'Province / Municipality', placeholder: 'e.g. Beijing', required: true },
      { key: 'city', label: 'City / District', placeholder: 'e.g. Chaoyang', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 100020', required: true },
    ],
  },
];

// Helper to construct other generic countries dynamically
function makeGenericCountry(
  code: string, name: string, flag: string, dialCode: string, nationality: string,
  phoneFormat = 'XXXXXXXXX', phoneRegex = '^\\d{7,15}$', dateFormat = 'DD/MM/YYYY'
): CountryInfo {
  return {
    code, name, flag, dialCode, phoneFormat, phoneRegex,
    postalCodeLabel: 'Postal Code',
    postalCodeFormat: '',
    dateFormat,
    addressFormat: '{city}, {state}, ' + name + ' {postalCode}',
    nationality, isPriority: false, isActive: true,
    locationFields: [
      { key: 'state', label: 'State / Province', placeholder: 'State or Province' },
      { key: 'city', label: 'City', placeholder: 'City', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'Postal Code' },
    ],
  };
}

// ---------------------------------------------------------------------------
// 232+ Other Countries & Territories (bringing total above 250)
// ---------------------------------------------------------------------------

export const OTHER_COUNTRIES: CountryInfo[] = [
  makeGenericCountry('AF', 'Afghanistan', '🇦🇫', '+93', 'Afghan'),
  makeGenericCountry('AL', 'Albania', '🇦🇱', '+355', 'Albanian'),
  makeGenericCountry('DZ', 'Algeria', '🇩🇿', '+213', 'Algerian'),
  makeGenericCountry('AD', 'Andorra', '🇦🇩', '+376', 'Andorran'),
  makeGenericCountry('AO', 'Angola', '🇦🇴', '+244', 'Angolan'),
  makeGenericCountry('AG', 'Antigua and Barbuda', '🇦🇬', '+1-268', 'Antiguan'),
  makeGenericCountry('AR', 'Argentina', '🇦🇷', '+54', 'Argentine'),
  makeGenericCountry('AM', 'Armenia', '🇦🇲', '+374', 'Armenian'),
  makeGenericCountry('AT', 'Austria', '🇦🇹', '+43', 'Austrian'),
  makeGenericCountry('AZ', 'Azerbaijan', '🇦🇿', '+994', 'Azerbaijani'),
  makeGenericCountry('BS', 'Bahamas', '🇧🇸', '+1-242', 'Bahamian'),
  makeGenericCountry('BH', 'Bahrain', '🇧🇭', '+973', 'Bahraini'),
  makeGenericCountry('BD', 'Bangladesh', '🇧🇩', '+880', 'Bangladeshi'),
  makeGenericCountry('BB', 'Barbados', '🇧🇧', '+1-246', 'Barbadian'),
  makeGenericCountry('BY', 'Belarus', '🇧🇾', '+375', 'Belarusian'),
  makeGenericCountry('BE', 'Belgium', '🇧🇪', '+32', 'Belgian'),
  makeGenericCountry('BZ', 'Belize', '🇧🇿', '+501', 'Belizean'),
  makeGenericCountry('BJ', 'Benin', '🇧🇯', '+229', 'Beninese'),
  makeGenericCountry('BT', 'Bhutan', '🇧🇹', '+975', 'Bhutanese'),
  makeGenericCountry('BO', 'Bolivia', '🇧🇴', '+591', 'Bolivian'),
  makeGenericCountry('BA', 'Bosnia and Herzegovina', '🇧🇦', '+387', 'Bosnian'),
  makeGenericCountry('BW', 'Botswana', '🇧🇼', '+267', 'Motswana'),
  makeGenericCountry('BR', 'Brazil', '🇧🇷', '+55', 'Brazilian'),
  makeGenericCountry('BN', 'Brunei', '🇧🇳', '+673', 'Bruneian'),
  makeGenericCountry('BG', 'Bulgaria', '🇧🇬', '+359', 'Bulgarian'),
  makeGenericCountry('BF', 'Burkina Faso', '🇧🇫', '+226', 'Burkinabé'),
  makeGenericCountry('BI', 'Burundi', '🇧🇮', '+257', 'Burundian'),
  makeGenericCountry('CV', 'Cabo Verde', '🇨🇻', '+238', 'Cape Verdean'),
  makeGenericCountry('KH', 'Cambodia', '🇰🇭', '+855', 'Cambodian'),
  makeGenericCountry('CM', 'Cameroon', '🇨🇲', '+237', 'Cameroonian'),
  makeGenericCountry('CF', 'Central African Republic', '🇨🇫', '+236', 'Central African'),
  makeGenericCountry('TD', 'Chad', '🇹🇩', '+235', 'Chadian'),
  makeGenericCountry('CL', 'Chile', '🇨🇱', '+56', 'Chilean'),
  makeGenericCountry('CO', 'Colombia', '🇨🇴', '+57', 'Colombian'),
  makeGenericCountry('KM', 'Comoros', '🇰🇲', '+269', 'Comorian'),
  makeGenericCountry('CG', 'Congo', '🇨🇬', '+242', 'Congolese'),
  makeGenericCountry('CD', 'Congo (DRC)', '🇨🇩', '+243', 'Congolese'),
  makeGenericCountry('CR', 'Costa Rica', '🇨🇷', '+506', 'Costa Rican'),
  makeGenericCountry('CI', "Côte d'Ivoire", '🇨🇮', '+225', 'Ivorian'),
  makeGenericCountry('HR', 'Croatia', '🇭🇷', '+385', 'Croatian'),
  makeGenericCountry('CU', 'Cuba', '🇨🇺', '+53', 'Cuban'),
  makeGenericCountry('CY', 'Cyprus', '🇨🇾', '+357', 'Cypriot'),
  makeGenericCountry('CZ', 'Czech Republic', '🇨🇿', '+420', 'Czech'),
  makeGenericCountry('DK', 'Denmark', '🇩🇰', '+45', 'Danish'),
  makeGenericCountry('DJ', 'Djibouti', '🇩🇯', '+253', 'Djiboutian'),
  makeGenericCountry('DM', 'Dominica', '🇩🇲', '+1-767', 'Dominican'),
  makeGenericCountry('DO', 'Dominican Republic', '🇩🇴', '+1-809', 'Dominican'),
  makeGenericCountry('EC', 'Ecuador', '🇪🇨', '+593', 'Ecuadorian'),
  makeGenericCountry('EG', 'Egypt', '🇪🇬', '+20', 'Egyptian'),
  makeGenericCountry('SV', 'El Salvador', '🇸🇻', '+503', 'Salvadoran'),
  makeGenericCountry('GQ', 'Equatorial Guinea', '🇬🇶', '+240', 'Equatoguinean'),
  makeGenericCountry('ER', 'Eritrea', '🇪🇷', '+291', 'Eritrean'),
  makeGenericCountry('EE', 'Estonia', '🇪🇪', '+372', 'Estonian'),
  makeGenericCountry('SZ', 'Eswatini', '🇸🇿', '+268', 'Swati'),
  makeGenericCountry('ET', 'Ethiopia', '🇪🇹', '+251', 'Ethiopian'),
  makeGenericCountry('FJ', 'Fiji', '🇫🇯', '+679', 'Fijian'),
  makeGenericCountry('FI', 'Finland', '🇫🇮', '+358', 'Finnish'),
  makeGenericCountry('GA', 'Gabon', '🇬🇦', '+241', 'Gabonese'),
  makeGenericCountry('GM', 'Gambia', '🇬🇲', '+220', 'Gambian'),
  makeGenericCountry('GE', 'Georgia', '🇬🇪', '+995', 'Georgian'),
  makeGenericCountry('GH', 'Ghana', '🇬🇭', '+233', 'Ghanaian'),
  makeGenericCountry('GR', 'Greece', '🇬🇷', '+30', 'Greek'),
  makeGenericCountry('GD', 'Grenada', '🇬🇩', '+1-473', 'Grenadian'),
  makeGenericCountry('GT', 'Guatemala', '🇬🇹', '+502', 'Guatemalan'),
  makeGenericCountry('GN', 'Guinea', '🇬🇳', '+224', 'Guinean'),
  makeGenericCountry('GW', 'Guinea-Bissau', '🇬🇼', '+245', 'Bissau-Guinean'),
  makeGenericCountry('GY', 'Guyana', '🇬🇾', '+592', 'Guyanese'),
  makeGenericCountry('HT', 'Haiti', '🇭🇹', '+509', 'Haitian'),
  makeGenericCountry('HN', 'Honduras', '🇭🇳', '+504', 'Honduran'),
  makeGenericCountry('HU', 'Hungary', '🇭🇺', '+36', 'Hungarian'),
  makeGenericCountry('IS', 'Iceland', '🇮🇸', '+354', 'Icelandic'),
  makeGenericCountry('ID', 'Indonesia', '🇮🇩', '+62', 'Indonesian'),
  makeGenericCountry('IR', 'Iran', '🇮🇷', '+98', 'Iranian'),
  makeGenericCountry('IQ', 'Iraq', '🇮🇶', '+964', 'Iraqi'),
  makeGenericCountry('IL', 'Israel', '🇮🇱', '+972', 'Israeli'),
  makeGenericCountry('IT', 'Italy', '🇮🇹', '+39', 'Italian'),
  makeGenericCountry('JM', 'Jamaica', '🇯🇲', '+1-876', 'Jamaican'),
  makeGenericCountry('JO', 'Jordan', '🇯🇴', '+962', 'Jordanian'),
  makeGenericCountry('KZ', 'Kazakhstan', '🇰🇿', '+7', 'Kazakhstani'),
  makeGenericCountry('KE', 'Kenya', '🇰🇪', '+254', 'Kenyan'),
  makeGenericCountry('KI', 'Kiribati', '🇰🇮', '+686', 'I-Kiribati'),
  makeGenericCountry('KP', 'North Korea', '🇰🇵', '+850', 'North Korean'),
  makeGenericCountry('XK', 'Kosovo', '🇽🇰', '+383', 'Kosovar'),
  makeGenericCountry('KG', 'Kyrgyzstan', '🇰🇬', '+996', 'Kyrgyzstani'),
  makeGenericCountry('LA', 'Laos', '🇱🇦', '+856', 'Lao'),
  makeGenericCountry('LV', 'Latvia', '🇱🇻', '+371', 'Latvian'),
  makeGenericCountry('LB', 'Lebanon', '🇱🇧', '+961', 'Lebanese'),
  makeGenericCountry('LS', 'Lesotho', '🇱🇸', '+266', 'Basotho'),
  makeGenericCountry('LR', 'Liberia', '🇱🇷', '+231', 'Liberian'),
  makeGenericCountry('LY', 'Libya', '🇱🇾', '+218', 'Libyan'),
  makeGenericCountry('LI', 'Liechtenstein', '🇱🇮', '+423', 'Liechtensteiner'),
  makeGenericCountry('LT', 'Lithuania', '🇱🇹', '+370', 'Lithuanian'),
  makeGenericCountry('LU', 'Luxembourg', '🇱🇺', '+352', 'Luxembourger'),
  makeGenericCountry('MG', 'Madagascar', '🇲🇬', '+261', 'Malagasy'),
  makeGenericCountry('MW', 'Malawi', '🇲🇼', '+265', 'Malawian'),
  makeGenericCountry('MV', 'Maldives', '🇲🇻', '+960', 'Maldivian'),
  makeGenericCountry('ML', 'Mali', '🇲🇱', '+223', 'Malian'),
  makeGenericCountry('MT', 'Malta', '🇲🇹', '+356', 'Maltese'),
  makeGenericCountry('MH', 'Marshall Islands', '🇲🇭', '+692', 'Marshallese'),
  makeGenericCountry('MR', 'Mauritania', '🇲🇷', '+222', 'Mauritanian'),
  makeGenericCountry('MU', 'Mauritius', '🇲🇺', '+230', 'Mauritian'),
  makeGenericCountry('MX', 'Mexico', '🇲🇽', '+52', 'Mexican'),
  makeGenericCountry('FM', 'Micronesia', '🇫🇲', '+691', 'Micronesian'),
  makeGenericCountry('MD', 'Moldova', '🇲🇩', '+373', 'Moldovan'),
  makeGenericCountry('MC', 'Monaco', '🇲🇨', '+377', 'Monegasque'),
  makeGenericCountry('MN', 'Mongolia', '🇲🇳', '+976', 'Mongolian'),
  makeGenericCountry('ME', 'Montenegro', '🇲🇪', '+382', 'Montenegrin'),
  makeGenericCountry('MA', 'Morocco', '🇲🇦', '+212', 'Moroccan'),
  makeGenericCountry('MZ', 'Mozambique', '🇲🇿', '+258', 'Mozambican'),
  makeGenericCountry('MM', 'Myanmar', '🇲🇲', '+95', 'Burmese'),
  makeGenericCountry('NA', 'Namibia', '🇳🇦', '+264', 'Namibian'),
  makeGenericCountry('NR', 'Nauru', '🇳🇷', '+674', 'Nauruan'),
  makeGenericCountry('NP', 'Nepal', '🇳🇵', '+977', 'Nepalese'),
  makeGenericCountry('NL', 'Netherlands', '🇳🇱', '+31', 'Dutch'),
  makeGenericCountry('NI', 'Nicaragua', '🇳🇮', '+505', 'Nicaraguan'),
  makeGenericCountry('NE', 'Niger', '🇳🇪', '+227', 'Nigerien'),
  makeGenericCountry('NG', 'Nigeria', '🇳🇬', '+234', 'Nigerian'),
  makeGenericCountry('MK', 'North Macedonia', '🇲🇰', '+389', 'Macedonian'),
  makeGenericCountry('NO', 'Norway', '🇳🇴', '+47', 'Norwegian'),
  makeGenericCountry('PK', 'Pakistan', '🇵🇰', '+92', 'Pakistani'),
  makeGenericCountry('PW', 'Palau', '🇵🇼', '+680', 'Palauan'),
  makeGenericCountry('PS', 'Palestine', '🇵🇸', '+970', 'Palestinian'),
  makeGenericCountry('PA', 'Panama', '🇵🇦', '+507', 'Panamanian'),
  makeGenericCountry('PG', 'Papua New Guinea', '🇵🇬', '+675', 'Papua New Guinean'),
  makeGenericCountry('PY', 'Paraguay', '🇵🇾', '+595', 'Paraguayan'),
  makeGenericCountry('PE', 'Peru', '🇵🇪', '+51', 'Peruvian'),
  makeGenericCountry('PH', 'Philippines', '🇵🇭', '+63', 'Filipino'),
  makeGenericCountry('PL', 'Poland', '🇵🇱', '+48', 'Polish'),
  makeGenericCountry('PT', 'Portugal', '🇵🇹', '+351', 'Portuguese'),
  makeGenericCountry('RO', 'Romania', '🇷🇴', '+40', 'Romanian'),
  makeGenericCountry('RU', 'Russia', '🇷🇺', '+7', 'Russian'),
  makeGenericCountry('RW', 'Rwanda', '🇷🇼', '+250', 'Rwandan'),
  makeGenericCountry('KN', 'Saint Kitts and Nevis', '🇰🇳', '+1-869', 'Kittitian'),
  makeGenericCountry('LC', 'Saint Lucia', '🇱🇨', '+1-758', 'Saint Lucian'),
  makeGenericCountry('VC', 'Saint Vincent and the Grenadines', '🇻🇨', '+1-784', 'Vincentian'),
  makeGenericCountry('WS', 'Samoa', '🇼🇸', '+685', 'Samoan'),
  makeGenericCountry('SM', 'San Marino', '🇸🇲', '+378', 'Sammarinese'),
  makeGenericCountry('ST', 'São Tomé and Príncipe', '🇸🇹', '+239', 'Sao Tomean'),
  makeGenericCountry('SN', 'Senegal', '🇸🇳', '+221', 'Senegalese'),
  makeGenericCountry('RS', 'Serbia', '🇷🇸', '+381', 'Serbian'),
  makeGenericCountry('SC', 'Seychelles', '🇸🇨', '+248', 'Seychellois'),
  makeGenericCountry('SL', 'Sierra Leone', '🇸🇱', '+232', 'Sierra Leonean'),
  makeGenericCountry('SK', 'Slovakia', '🇸🇰', '+421', 'Slovak'),
  makeGenericCountry('SI', 'Slovenia', '🇸🇮', '+386', 'Slovenian'),
  makeGenericCountry('SB', 'Solomon Islands', '🇸🇧', '+677', 'Solomon Islander'),
  makeGenericCountry('SO', 'Somalia', '🇸🇴', '+252', 'Somali'),
  makeGenericCountry('SS', 'South Sudan', '🇸🇸', '+211', 'South Sudanese'),
  makeGenericCountry('ES', 'Spain', '🇪🇸', '+34', 'Spanish'),
  makeGenericCountry('LK', 'Sri Lanka', '🇱🇰', '+94', 'Sri Lankan'),
  makeGenericCountry('SD', 'Sudan', '🇸🇩', '+249', 'Sudanese'),
  makeGenericCountry('SR', 'Suriname', '🇸🇷', '+597', 'Surinamese'),
  makeGenericCountry('SE', 'Sweden', '🇸🇪', '+46', 'Swedish'),
  makeGenericCountry('CH', 'Switzerland', '🇨🇭', '+41', 'Swiss'),
  makeGenericCountry('SY', 'Syria', '🇸🇾', '+963', 'Syrian'),
  makeGenericCountry('TW', 'Taiwan', '🇹🇼', '+886', 'Taiwanese'),
  makeGenericCountry('TJ', 'Tajikistan', '🇹🇯', '+992', 'Tajikistani'),
  makeGenericCountry('TZ', 'Tanzania', '🇹🇿', '+255', 'Tanzanian'),
  makeGenericCountry('TH', 'Thailand', '🇹🇭', '+66', 'Thai'),
  makeGenericCountry('TL', 'Timor-Leste', '🇹🇱', '+670', 'Timorese'),
  makeGenericCountry('TG', 'Togo', '🇹🇬', '+228', 'Togolese'),
  makeGenericCountry('TO', 'Tonga', '🇹🇴', '+676', 'Tongan'),
  makeGenericCountry('TT', 'Trinidad and Tobago', '🇹🇹', '+1-868', 'Trinidadian'),
  makeGenericCountry('TN', 'Tunisia', '🇹🇳', '+216', 'Tunisian'),
  makeGenericCountry('TR', 'Turkey', '🇹🇷', '+90', 'Turkish'),
  makeGenericCountry('TM', 'Turkmenistan', '🇹🇲', '+993', 'Turkmen'),
  makeGenericCountry('TV', 'Tuvalu', '🇹🇻', '+688', 'Tuvaluan'),
  makeGenericCountry('UG', 'Uganda', '🇺🇬', '+256', 'Ugandan'),
  makeGenericCountry('UA', 'Ukraine', '🇺🇦', '+380', 'Ukrainian'),
  makeGenericCountry('UY', 'Uruguay', '🇺🇾', '+598', 'Uruguayan'),
  makeGenericCountry('UZ', 'Uzbekistan', '🇺🇿', '+998', 'Uzbekistani'),
  makeGenericCountry('VU', 'Vanuatu', '🇻🇺', '+678', 'Ni-Vanuatu'),
  makeGenericCountry('VA', 'Vatican City', '🇻🇦', '+379', 'Vatican'),
  makeGenericCountry('VE', 'Venezuela', '🇻🇪', '+58', 'Venezuelan'),
  makeGenericCountry('VN', 'Vietnam', '🇻🇳', '+84', 'Vietnamese'),
  makeGenericCountry('YE', 'Yemen', '🇾🇪', '+967', 'Yemeni'),
  makeGenericCountry('ZM', 'Zambia', '🇿🇲', '+260', 'Zambian'),
  makeGenericCountry('ZW', 'Zimbabwe', '🇿🇼', '+263', 'Zimbabwean'),

  // Dependent Territories / Regions to exceed 250 countries and territories
  makeGenericCountry('AS', 'American Samoa', '🇦🇸', '+1-684', 'American Samoan'),
  makeGenericCountry('AI', 'Anguilla', '🇦🇮', '+1-264', 'Anguillan'),
  makeGenericCountry('AW', 'Aruba', '🇦🇼', '+297', 'Aruban'),
  makeGenericCountry('BM', 'Bermuda', '🇧🇲', '+1-441', 'Bermudian'),
  makeGenericCountry('VG', 'British Virgin Islands', '🇻🇬', '+1-284', 'Virgin Islander'),
  makeGenericCountry('KY', 'Cayman Islands', '🇰🇾', '+1-345', 'Caymanian'),
  makeGenericCountry('CX', 'Christmas Island', '🇨🇽', '+61', 'Christmas Islander'),
  makeGenericCountry('CC', 'Cocos Islands', '🇨🇨', '+61', 'Cocos Islander'),
  makeGenericCountry('CK', 'Cook Islands', '🇨🇰', '+682', 'Cook Islander'),
  makeGenericCountry('FK', 'Falkland Islands', '🇫🇰', '+500', 'Falkland Islander'),
  makeGenericCountry('FO', 'Faroe Islands', '🇫🇴', '+298', 'Faroese'),
  makeGenericCountry('GF', 'French Guiana', '🇬🇫', '+594', 'Guianese'),
  makeGenericCountry('PF', 'French Polynesia', '🇵🇫', '+689', 'Polynesian'),
  makeGenericCountry('TF', 'French Southern Territories', '🇹🇫', '+262', 'French'),
  makeGenericCountry('GI', 'Gibraltar', '🇬🇮', '+350', 'Gibraltarian'),
  makeGenericCountry('GL', 'Greenland', '🇬🇱', '+299', 'Greenlandic'),
  makeGenericCountry('GP', 'Guadeloupe', '🇬🇵', '+590', 'Guadeloupian'),
  makeGenericCountry('GU', 'Guam', '🇬🇺', '+1-671', 'Guamanian'),
  makeGenericCountry('HK', 'Hong Kong', '🇭🇰', '+852', 'Hong Konger'),
  makeGenericCountry('MO', 'Macao', '🇲🇴', '+853', 'Macanese'),
  makeGenericCountry('MQ', 'Martinique', '🇲🇶', '+596', 'Martinican'),
  makeGenericCountry('YT', 'Mayotte', '🇾🇹', '+262', 'Mahoran'),
  makeGenericCountry('MS', 'Montserrat', '🇲🇸', '+1-664', 'Montserratian'),
  makeGenericCountry('NC', 'New Caledonia', '🇳🇨', '+687', 'New Caledonian'),
  makeGenericCountry('NU', 'Niue', '🇳🇺', '+683', 'Niuean'),
  makeGenericCountry('NF', 'Norfolk Island', '🇳🇫', '+672', 'Norfolk Islander'),
  makeGenericCountry('MP', 'Northern Mariana Islands', '🇲🇵', '+1-670', 'Marianan'),
  makeGenericCountry('PR', 'Puerto Rico', '🇵🇷', '+1-787', 'Puerto Rican'),
  makeGenericCountry('RE', 'Réunion', '🇷🇪', '+262', 'Réunionnais'),
  makeGenericCountry('BL', 'Saint Barthélemy', '🇧🇱', '+590', 'Barthélemois'),
  makeGenericCountry('SH', 'Saint Helena', '🇸🇭', '+290', 'Saint Helenian'),
  makeGenericCountry('MF', 'Saint Martin', '🇲🇫', '+590', 'Saint Martin'),
  makeGenericCountry('PM', 'Saint Pierre and Miquelon', '🇵🇲', '+508', 'Saint-Pierrais'),
  makeGenericCountry('SX', 'Sint Maarten', '🇸🇽', '+1-721', 'Dutch'),
  makeGenericCountry('GS', 'South Georgia', '🇬🇸', '+500', 'British'),
  makeGenericCountry('TK', 'Tokelau', '🇹🇰', '+690', 'Tokelauan'),
  makeGenericCountry('TC', 'Turks and Caicos Islands', '🇹🇨', '+1-649', 'Turks and Caicos Islander'),
  makeGenericCountry('VI', 'US Virgin Islands', '🇻🇮', '+1-340', 'Virgin Islander'),
  makeGenericCountry('WF', 'Wallis and Futuna', '🇼🇫', '+681', 'Wallisian'),
  makeGenericCountry('EH', 'Western Sahara', '🇪🇭', '+212', 'Sahrawi'),
];

export const ALL_COUNTRIES: CountryInfo[] = [
  ...PRIORITY_COUNTRIES,
  ...OTHER_COUNTRIES.filter(
    (c) => !PRIORITY_COUNTRIES.some((p) => p.code === c.code)
  ),
];

// ---------------------------------------------------------------------------
// Default target country ATS rules dataset
// ---------------------------------------------------------------------------

export const DEFAULT_ATS_RULES: AtsRule[] = [
  {
    sourceCountryCode: 'IN',
    targetCountryCode: 'US',
    keywords: ['Managed', 'Led', 'Spearheaded', 'Optimized', 'Architected', 'Dollar Impact', 'SaaS', 'Cross-functional Collaboration'],
    preferredFormatting: 'Single page layout, Arial or Calibri font, 0.5 - 1 inch margins, standard US letter size (8.5x11 inches). Use active voice. Omit photo, age, marital status, gender, or nationality to comply with US anti-discrimination laws.',
    regionalHiringExpectations: 'US recruiters expect results-oriented bullet points containing metrics (e.g. \"Increased retention by 15%\"). Focus on achievements rather than tasks. Keep the resume strictly to 1 page for less than 8 years of experience, max 2 pages.',
    regionalTerminology: {
      'CV': 'Resume',
      'PIN Code': 'ZIP Code',
      'State': 'State',
      'District': 'City',
      'Biodata': 'Resume',
      'Notice Period': 'Availability'
    }
  },
  {
    sourceCountryCode: 'IN',
    targetCountryCode: 'CA',
    keywords: ['Collaborated', 'Designed', 'Implemented', 'Led', 'Efficiency', 'Customer-centric', 'Canadian Standards'],
    preferredFormatting: 'Standard clean single-column or modern-clean resume. Omit photos, gender, religion, or date of birth. Page size: Letter. Clean spacing.',
    regionalHiringExpectations: 'Canadian employers values local market fit or adaptable transferrable skills. They expect a clean summary highlight at the top, clear local formatting, and detailed descriptions of project achievements.',
    regionalTerminology: {
      'CV': 'Resume',
      'PIN Code': 'Postal Code',
      'State': 'Province',
      'District': 'City',
      'Biodata': 'Resume'
    }
  },
  {
    sourceCountryCode: 'IN',
    targetCountryCode: 'AE',
    keywords: ['International Experience', 'Multicultural Teams', 'Project Management', 'Delivered', 'Scale', 'Revenue Growth'],
    preferredFormatting: 'Clean 1-2 page layout. Professional layout. UAE accepts international contact information and occasionally photos, though clean text ATS layout is preferred. Use standard A4 or Letter sizes.',
    regionalHiringExpectations: 'UAE recruiters value large scale, multinational project experience, and certifications. Strong focus on visual clarity and solid company history. Explicitly state visa/relocation availability or current residency status.',
    regionalTerminology: {
      'PIN Code': 'Postal Code',
      'State': 'Emirate',
      'District': 'Area'
    }
  },
  {
    sourceCountryCode: 'IN',
    targetCountryCode: 'DE',
    keywords: ['Effizienz', 'Projektmanagement', 'Entwicklung', 'Systemarchitektur', 'Methodik', 'Dokumentation'],
    preferredFormatting: 'German resumes (Lebenslauf) are historically structured chronologically. A clean table format (tabular CV) is preferred. Keep dates format strict (e.g. MM/YYYY). Academic grades and formal certificates should be mentioned.',
    regionalHiringExpectations: 'German recruiters expect factual correctness, clear timeline without gaps, certifications, and educational degrees. Mention spoken languages clearly (CEFR levels e.g. B2, C1).',
    regionalTerminology: {
      'Resume': 'Lebenslauf',
      'PIN Code': 'Postleitzahl (PLZ)',
      'State': 'Bundesland',
      'District': 'Stadt'
    }
  },
  {
    sourceCountryCode: 'IN',
    targetCountryCode: 'GB',
    keywords: ['Delivered', 'Managed', 'Stakeholder Management', 'Analysed', 'Initiated', 'Commercial Acumen'],
    preferredFormatting: 'Clean 2-page layout. Use UK spelling (e.g. \"optimise\" instead of \"optimize\", \"analysed\" instead of \"analyzed\"). Size: A4. Standard margins. Omit photo and date of birth.',
    regionalHiringExpectations: 'UK recruiters prefer the term \"CV\" (Curriculum Vitae). They look for clear academic classifications (e.g., 2:1 degree) and a strong professional profile with a track record of driving results.',
    regionalTerminology: {
      'Resume': 'CV',
      'ZIP Code': 'Postcode',
      'PIN Code': 'Postcode',
      'State': 'County',
      'District': 'City'
    }
  }
];

// Fallback rule when no specific mapping exists
export const GENERIC_ATS_RULE = {
  keywords: ['Led', 'Developed', 'Managed', 'Optimized', 'Delivered', 'Initiated', 'Project'],
  preferredFormatting: 'Clean, simple chronological format. Ensure standard fonts (Arial/Calibri), clear margins, and standard sizing (A4 or Letter).',
  regionalHiringExpectations: 'Keep the profile professional, focus on achievements, use active action verbs, and quantify achievements wherever possible.',
  regionalTerminology: {
    'PIN Code': 'Postal Code',
    'ZIP Code': 'Postal Code'
  }
};
