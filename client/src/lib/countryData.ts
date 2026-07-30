// ============================================================================
// Country & Region Management Data Module
// ============================================================================
// Contains all country metadata, format rules, and dynamic location hierarchies.
// Priority countries appear first in dropdowns with full location field support.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  /** If provided, renders as a <select> dropdown instead of free-text input */
  options?: string[];
}

export interface CountryInfo {
  code: string;            // ISO 3166-1 alpha-2
  name: string;
  flag: string;            // Unicode emoji flag
  dialCode: string;        // e.g. "+91"
  phoneFormat: string;     // Placeholder (e.g. "XXXXX XXXXX")
  postalCodeLabel: string; // "PIN Code", "ZIP Code", "Postal Code"
  postalCodeFormat: string; // Regex-friendly pattern placeholder
  dateFormat: string;      // e.g. "DD/MM/YYYY"
  addressFormat: string;   // Template: "{city}, {state}, {country} - {postalCode}"
  locationFields: LocationField[];
  isPriority?: boolean;
}

// ---------------------------------------------------------------------------
// Indian States/UTs
// ---------------------------------------------------------------------------
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ---------------------------------------------------------------------------
// US States
// ---------------------------------------------------------------------------
const US_STATES = [
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

// ---------------------------------------------------------------------------
// UAE Emirates
// ---------------------------------------------------------------------------
const UAE_EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
  'Ras Al Khaimah', 'Fujairah',
];

// ---------------------------------------------------------------------------
// UK Counties (major)
// ---------------------------------------------------------------------------
const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'Cornwall', 'County Durham', 'Cumbria', 'Derbyshire', 'Devon',
  'Dorset', 'East Sussex', 'Essex', 'Gloucestershire', 'Greater London',
  'Greater Manchester', 'Hampshire', 'Herefordshire', 'Hertfordshire',
  'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire', 'Lincolnshire',
  'Merseyside', 'Norfolk', 'North Yorkshire', 'Northamptonshire',
  'Northumberland', 'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire',
  'Somerset', 'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey',
  'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex',
  'West Yorkshire', 'Wiltshire', 'Worcestershire', 'Scotland', 'Wales',
  'Northern Ireland',
];

// ---------------------------------------------------------------------------
// Canadian Provinces
// ---------------------------------------------------------------------------
const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Yukon',
];

// ---------------------------------------------------------------------------
// Australian States
// ---------------------------------------------------------------------------
const AUSTRALIAN_STATES = [
  'Australian Capital Territory', 'New South Wales', 'Northern Territory',
  'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
];

// ---------------------------------------------------------------------------
// German States (Bundesländer)
// ---------------------------------------------------------------------------
const GERMAN_STATES = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
  'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony',
  'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
];

// ---------------------------------------------------------------------------
// Saudi Regions
// ---------------------------------------------------------------------------
const SAUDI_REGIONS = [
  'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk',
  'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Baha', 'Al Jawf',
  'Qassim',
];

// ---------------------------------------------------------------------------
// Priority Countries (20) with full location hierarchies
// ---------------------------------------------------------------------------
export const PRIORITY_COUNTRIES: CountryInfo[] = [
  {
    code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91',
    phoneFormat: 'XXXXX XXXXX', postalCodeLabel: 'PIN Code',
    postalCodeFormat: '6 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {district}, {state}, India - {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'Select state', required: true, options: INDIAN_STATES },
      { key: 'district', label: 'District', placeholder: 'e.g. Ernakulam' },
      { key: 'city', label: 'City', placeholder: 'e.g. Kochi', required: true },
      { key: 'postalCode', label: 'PIN Code', placeholder: 'e.g. 682001' },
    ],
  },
  {
    code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1',
    phoneFormat: '(XXX) XXX-XXXX', postalCodeLabel: 'ZIP Code',
    postalCodeFormat: '5 digits', dateFormat: 'MM/DD/YYYY',
    addressFormat: '{city}, {state} {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'Select state', required: true, options: US_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. San Francisco', required: true },
      { key: 'postalCode', label: 'ZIP Code', placeholder: 'e.g. 94102' },
    ],
  },
  {
    code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44',
    phoneFormat: 'XXXX XXXXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: 'e.g. SW1A 1AA', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {county}, {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'county', label: 'County / Region', placeholder: 'Select county', options: UK_COUNTIES },
      { key: 'city', label: 'City', placeholder: 'e.g. London', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. SW1A 1AA' },
    ],
  },
  {
    code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1',
    phoneFormat: '(XXX) XXX-XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: 'e.g. K1A 0B1', dateFormat: 'YYYY-MM-DD',
    addressFormat: '{city}, {state}, Canada {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Province / Territory', placeholder: 'Select province', required: true, options: CANADIAN_PROVINCES },
      { key: 'city', label: 'City', placeholder: 'e.g. Toronto', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. M5H 2N2' },
    ],
  },
  {
    code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61',
    phoneFormat: 'XXX XXX XXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '4 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Australia {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'State / Territory', placeholder: 'Select state', required: true, options: AUSTRALIAN_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. Sydney', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 2000' },
    ],
  },
  {
    code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49',
    phoneFormat: 'XXX XXXXXXX', postalCodeLabel: 'Postal Code (PLZ)',
    postalCodeFormat: '5 digits', dateFormat: 'DD.MM.YYYY',
    addressFormat: '{postalCode} {city}, {state}, Germany',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Bundesland', placeholder: 'Select state', options: GERMAN_STATES },
      { key: 'city', label: 'City', placeholder: 'e.g. Berlin', required: true },
      { key: 'postalCode', label: 'Postal Code (PLZ)', placeholder: 'e.g. 10115' },
    ],
  },
  {
    code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33',
    phoneFormat: 'X XX XX XX XX', postalCodeLabel: 'Code Postal',
    postalCodeFormat: '5 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{postalCode} {city}, France',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Paris', required: true },
      { key: 'postalCode', label: 'Code Postal', placeholder: 'e.g. 75001' },
    ],
  },
  {
    code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971',
    phoneFormat: 'XX XXX XXXX', postalCodeLabel: 'N/A',
    postalCodeFormat: '', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {emirate}, UAE',
    isPriority: true,
    locationFields: [
      { key: 'emirate', label: 'Emirate', placeholder: 'Select emirate', required: true, options: UAE_EMIRATES },
      { key: 'city', label: 'City', placeholder: 'e.g. Dubai Marina', required: true },
    ],
  },
  {
    code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966',
    phoneFormat: 'XX XXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '5 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Saudi Arabia {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Region', placeholder: 'Select region', required: true, options: SAUDI_REGIONS },
      { key: 'city', label: 'City', placeholder: 'e.g. Riyadh', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 11564' },
    ],
  },
  {
    code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65',
    phoneFormat: 'XXXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '6 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: 'Singapore {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'Area / District', placeholder: 'e.g. Orchard', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 238823' },
    ],
  },
  {
    code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974',
    phoneFormat: 'XXXX XXXX', postalCodeLabel: 'N/A',
    postalCodeFormat: '', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Qatar',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Doha', required: true },
    ],
  },
  {
    code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965',
    phoneFormat: 'XXXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '5 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Kuwait {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Kuwait City', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 13001' },
    ],
  },
  {
    code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968',
    phoneFormat: 'XXXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '3 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Oman {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Muscat', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 100' },
    ],
  },
  {
    code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64',
    phoneFormat: 'XX XXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '4 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, New Zealand {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Auckland', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 1010' },
    ],
  },
  {
    code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353',
    phoneFormat: 'XX XXX XXXX', postalCodeLabel: 'Eircode',
    postalCodeFormat: 'e.g. D02 AF30', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, Ireland {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'city', label: 'City', placeholder: 'e.g. Dublin', required: true },
      { key: 'postalCode', label: 'Eircode', placeholder: 'e.g. D02 AF30' },
    ],
  },
  {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27',
    phoneFormat: 'XX XXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '4 digits', dateFormat: 'YYYY/MM/DD',
    addressFormat: '{city}, {state}, South Africa {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Province', placeholder: 'e.g. Gauteng', required: true },
      { key: 'city', label: 'City', placeholder: 'e.g. Johannesburg', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 2000' },
    ],
  },
  {
    code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60',
    phoneFormat: 'XX-XXXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '5 digits', dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, Malaysia {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'State', placeholder: 'e.g. Selangor', required: true },
      { key: 'city', label: 'City', placeholder: 'e.g. Kuala Lumpur', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 50000' },
    ],
  },
  {
    code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81',
    phoneFormat: 'XX-XXXX-XXXX', postalCodeLabel: 'Postal Code (〒)',
    postalCodeFormat: 'XXX-XXXX', dateFormat: 'YYYY/MM/DD',
    addressFormat: '〒{postalCode} {state}, {city}, Japan',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Prefecture', placeholder: 'e.g. Tokyo', required: true },
      { key: 'city', label: 'City / Ward', placeholder: 'e.g. Shibuya', required: true },
      { key: 'postalCode', label: 'Postal Code (〒)', placeholder: 'e.g. 150-0002' },
    ],
  },
  {
    code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82',
    phoneFormat: 'XX-XXXX-XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '5 digits', dateFormat: 'YYYY.MM.DD',
    addressFormat: '{city}, {state}, South Korea {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Province / City', placeholder: 'e.g. Seoul', required: true },
      { key: 'city', label: 'District', placeholder: 'e.g. Gangnam-gu', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 06164' },
    ],
  },
  {
    code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86',
    phoneFormat: 'XXX XXXX XXXX', postalCodeLabel: 'Postal Code',
    postalCodeFormat: '6 digits', dateFormat: 'YYYY-MM-DD',
    addressFormat: '{city}, {state}, China {postalCode}',
    isPriority: true,
    locationFields: [
      { key: 'state', label: 'Province / Municipality', placeholder: 'e.g. Beijing', required: true },
      { key: 'city', label: 'City / District', placeholder: 'e.g. Chaoyang', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'e.g. 100020' },
    ],
  },
];

// ---------------------------------------------------------------------------
// All remaining ISO 3166-1 countries (sorted alphabetically)
// Each uses a generic location hierarchy: State/Province → City → Postal Code
// ---------------------------------------------------------------------------

function makeGenericCountry(
  code: string, name: string, flag: string, dialCode: string,
  phoneFormat = 'XXXXXXXXX', dateFormat = 'DD/MM/YYYY'
): CountryInfo {
  return {
    code, name, flag, dialCode, phoneFormat,
    postalCodeLabel: 'Postal Code',
    postalCodeFormat: '',
    dateFormat,
    addressFormat: '{city}, {state}, ' + name + ' {postalCode}',
    locationFields: [
      { key: 'state', label: 'State / Province', placeholder: 'State or Province' },
      { key: 'city', label: 'City', placeholder: 'City', required: true },
      { key: 'postalCode', label: 'Postal Code', placeholder: 'Postal Code' },
    ],
  };
}

const OTHER_COUNTRIES: CountryInfo[] = [
  makeGenericCountry('AF', 'Afghanistan', '🇦🇫', '+93'),
  makeGenericCountry('AL', 'Albania', '🇦🇱', '+355'),
  makeGenericCountry('DZ', 'Algeria', '🇩🇿', '+213'),
  makeGenericCountry('AD', 'Andorra', '🇦🇩', '+376'),
  makeGenericCountry('AO', 'Angola', '🇦🇴', '+244'),
  makeGenericCountry('AG', 'Antigua and Barbuda', '🇦🇬', '+1-268'),
  makeGenericCountry('AR', 'Argentina', '🇦🇷', '+54'),
  makeGenericCountry('AM', 'Armenia', '🇦🇲', '+374'),
  makeGenericCountry('AT', 'Austria', '🇦🇹', '+43'),
  makeGenericCountry('AZ', 'Azerbaijan', '🇦🇿', '+994'),
  makeGenericCountry('BS', 'Bahamas', '🇧🇸', '+1-242'),
  makeGenericCountry('BH', 'Bahrain', '🇧🇭', '+973'),
  makeGenericCountry('BD', 'Bangladesh', '🇧🇩', '+880'),
  makeGenericCountry('BB', 'Barbados', '🇧🇧', '+1-246'),
  makeGenericCountry('BY', 'Belarus', '🇧🇾', '+375'),
  makeGenericCountry('BE', 'Belgium', '🇧🇪', '+32'),
  makeGenericCountry('BZ', 'Belize', '🇧🇿', '+501'),
  makeGenericCountry('BJ', 'Benin', '🇧🇯', '+229'),
  makeGenericCountry('BT', 'Bhutan', '🇧🇹', '+975'),
  makeGenericCountry('BO', 'Bolivia', '🇧🇴', '+591'),
  makeGenericCountry('BA', 'Bosnia and Herzegovina', '🇧🇦', '+387'),
  makeGenericCountry('BW', 'Botswana', '🇧🇼', '+267'),
  makeGenericCountry('BR', 'Brazil', '🇧🇷', '+55'),
  makeGenericCountry('BN', 'Brunei', '🇧🇳', '+673'),
  makeGenericCountry('BG', 'Bulgaria', '🇧🇬', '+359'),
  makeGenericCountry('BF', 'Burkina Faso', '🇧🇫', '+226'),
  makeGenericCountry('BI', 'Burundi', '🇧🇮', '+257'),
  makeGenericCountry('CV', 'Cabo Verde', '🇨🇻', '+238'),
  makeGenericCountry('KH', 'Cambodia', '🇰🇭', '+855'),
  makeGenericCountry('CM', 'Cameroon', '🇨🇲', '+237'),
  makeGenericCountry('CF', 'Central African Republic', '🇨🇫', '+236'),
  makeGenericCountry('TD', 'Chad', '🇹🇩', '+235'),
  makeGenericCountry('CL', 'Chile', '🇨🇱', '+56'),
  makeGenericCountry('CO', 'Colombia', '🇨🇴', '+57'),
  makeGenericCountry('KM', 'Comoros', '🇰🇲', '+269'),
  makeGenericCountry('CG', 'Congo', '🇨🇬', '+242'),
  makeGenericCountry('CD', 'Congo (DRC)', '🇨🇩', '+243'),
  makeGenericCountry('CR', 'Costa Rica', '🇨🇷', '+506'),
  makeGenericCountry('CI', "Côte d'Ivoire", '🇨🇮', '+225'),
  makeGenericCountry('HR', 'Croatia', '🇭🇷', '+385'),
  makeGenericCountry('CU', 'Cuba', '🇨🇺', '+53'),
  makeGenericCountry('CY', 'Cyprus', '🇨🇾', '+357'),
  makeGenericCountry('CZ', 'Czech Republic', '🇨🇿', '+420'),
  makeGenericCountry('DK', 'Denmark', '🇩🇰', '+45'),
  makeGenericCountry('DJ', 'Djibouti', '🇩🇯', '+253'),
  makeGenericCountry('DM', 'Dominica', '🇩🇲', '+1-767'),
  makeGenericCountry('DO', 'Dominican Republic', '🇩🇴', '+1-809'),
  makeGenericCountry('EC', 'Ecuador', '🇪🇨', '+593'),
  makeGenericCountry('EG', 'Egypt', '🇪🇬', '+20'),
  makeGenericCountry('SV', 'El Salvador', '🇸🇻', '+503'),
  makeGenericCountry('GQ', 'Equatorial Guinea', '🇬🇶', '+240'),
  makeGenericCountry('ER', 'Eritrea', '🇪🇷', '+291'),
  makeGenericCountry('EE', 'Estonia', '🇪🇪', '+372'),
  makeGenericCountry('SZ', 'Eswatini', '🇸🇿', '+268'),
  makeGenericCountry('ET', 'Ethiopia', '🇪🇹', '+251'),
  makeGenericCountry('FJ', 'Fiji', '🇫🇯', '+679'),
  makeGenericCountry('FI', 'Finland', '🇫🇮', '+358'),
  makeGenericCountry('GA', 'Gabon', '🇬🇦', '+241'),
  makeGenericCountry('GM', 'Gambia', '🇬🇲', '+220'),
  makeGenericCountry('GE', 'Georgia', '🇬🇪', '+995'),
  makeGenericCountry('GH', 'Ghana', '🇬🇭', '+233'),
  makeGenericCountry('GR', 'Greece', '🇬🇷', '+30'),
  makeGenericCountry('GD', 'Grenada', '🇬🇩', '+1-473'),
  makeGenericCountry('GT', 'Guatemala', '🇬🇹', '+502'),
  makeGenericCountry('GN', 'Guinea', '🇬🇳', '+224'),
  makeGenericCountry('GW', 'Guinea-Bissau', '🇬🇼', '+245'),
  makeGenericCountry('GY', 'Guyana', '🇬🇾', '+592'),
  makeGenericCountry('HT', 'Haiti', '🇭🇹', '+509'),
  makeGenericCountry('HN', 'Honduras', '🇭🇳', '+504'),
  makeGenericCountry('HU', 'Hungary', '🇭🇺', '+36'),
  makeGenericCountry('IS', 'Iceland', '🇮🇸', '+354'),
  makeGenericCountry('ID', 'Indonesia', '🇮🇩', '+62'),
  makeGenericCountry('IR', 'Iran', '🇮🇷', '+98'),
  makeGenericCountry('IQ', 'Iraq', '🇮🇶', '+964'),
  makeGenericCountry('IL', 'Israel', '🇮🇱', '+972'),
  makeGenericCountry('IT', 'Italy', '🇮🇹', '+39'),
  makeGenericCountry('JM', 'Jamaica', '🇯🇲', '+1-876'),
  makeGenericCountry('JO', 'Jordan', '🇯🇴', '+962'),
  makeGenericCountry('KZ', 'Kazakhstan', '🇰🇿', '+7'),
  makeGenericCountry('KE', 'Kenya', '🇰🇪', '+254'),
  makeGenericCountry('KI', 'Kiribati', '🇰🇮', '+686'),
  makeGenericCountry('KP', 'North Korea', '🇰🇵', '+850'),
  makeGenericCountry('XK', 'Kosovo', '🇽🇰', '+383'),
  makeGenericCountry('KG', 'Kyrgyzstan', '🇰🇬', '+996'),
  makeGenericCountry('LA', 'Laos', '🇱🇦', '+856'),
  makeGenericCountry('LV', 'Latvia', '🇱🇻', '+371'),
  makeGenericCountry('LB', 'Lebanon', '🇱🇧', '+961'),
  makeGenericCountry('LS', 'Lesotho', '🇱🇸', '+266'),
  makeGenericCountry('LR', 'Liberia', '🇱🇷', '+231'),
  makeGenericCountry('LY', 'Libya', '🇱🇾', '+218'),
  makeGenericCountry('LI', 'Liechtenstein', '🇱🇮', '+423'),
  makeGenericCountry('LT', 'Lithuania', '🇱🇹', '+370'),
  makeGenericCountry('LU', 'Luxembourg', '🇱🇺', '+352'),
  makeGenericCountry('MG', 'Madagascar', '🇲🇬', '+261'),
  makeGenericCountry('MW', 'Malawi', '🇲🇼', '+265'),
  makeGenericCountry('MV', 'Maldives', '🇲🇻', '+960'),
  makeGenericCountry('ML', 'Mali', '🇲🇱', '+223'),
  makeGenericCountry('MT', 'Malta', '🇲🇹', '+356'),
  makeGenericCountry('MH', 'Marshall Islands', '🇲🇭', '+692'),
  makeGenericCountry('MR', 'Mauritania', '🇲🇷', '+222'),
  makeGenericCountry('MU', 'Mauritius', '🇲🇺', '+230'),
  makeGenericCountry('MX', 'Mexico', '🇲🇽', '+52'),
  makeGenericCountry('FM', 'Micronesia', '🇫🇲', '+691'),
  makeGenericCountry('MD', 'Moldova', '🇲🇩', '+373'),
  makeGenericCountry('MC', 'Monaco', '🇲🇨', '+377'),
  makeGenericCountry('MN', 'Mongolia', '🇲🇳', '+976'),
  makeGenericCountry('ME', 'Montenegro', '🇲🇪', '+382'),
  makeGenericCountry('MA', 'Morocco', '🇲🇦', '+212'),
  makeGenericCountry('MZ', 'Mozambique', '🇲🇿', '+258'),
  makeGenericCountry('MM', 'Myanmar', '🇲🇲', '+95'),
  makeGenericCountry('NA', 'Namibia', '🇳🇦', '+264'),
  makeGenericCountry('NR', 'Nauru', '🇳🇷', '+674'),
  makeGenericCountry('NP', 'Nepal', '🇳🇵', '+977'),
  makeGenericCountry('NL', 'Netherlands', '🇳🇱', '+31'),
  makeGenericCountry('NI', 'Nicaragua', '🇳🇮', '+505'),
  makeGenericCountry('NE', 'Niger', '🇳🇪', '+227'),
  makeGenericCountry('NG', 'Nigeria', '🇳🇬', '+234'),
  makeGenericCountry('MK', 'North Macedonia', '🇲🇰', '+389'),
  makeGenericCountry('NO', 'Norway', '🇳🇴', '+47'),
  makeGenericCountry('PK', 'Pakistan', '🇵🇰', '+92'),
  makeGenericCountry('PW', 'Palau', '🇵🇼', '+680'),
  makeGenericCountry('PS', 'Palestine', '🇵🇸', '+970'),
  makeGenericCountry('PA', 'Panama', '🇵🇦', '+507'),
  makeGenericCountry('PG', 'Papua New Guinea', '🇵🇬', '+675'),
  makeGenericCountry('PY', 'Paraguay', '🇵🇾', '+595'),
  makeGenericCountry('PE', 'Peru', '🇵🇪', '+51'),
  makeGenericCountry('PH', 'Philippines', '🇵🇭', '+63'),
  makeGenericCountry('PL', 'Poland', '🇵🇱', '+48'),
  makeGenericCountry('PT', 'Portugal', '🇵🇹', '+351'),
  makeGenericCountry('RO', 'Romania', '🇷🇴', '+40'),
  makeGenericCountry('RU', 'Russia', '🇷🇺', '+7'),
  makeGenericCountry('RW', 'Rwanda', '🇷🇼', '+250'),
  makeGenericCountry('KN', 'Saint Kitts and Nevis', '🇰🇳', '+1-869'),
  makeGenericCountry('LC', 'Saint Lucia', '🇱🇨', '+1-758'),
  makeGenericCountry('VC', 'Saint Vincent and the Grenadines', '🇻🇨', '+1-784'),
  makeGenericCountry('WS', 'Samoa', '🇼🇸', '+685'),
  makeGenericCountry('SM', 'San Marino', '🇸🇲', '+378'),
  makeGenericCountry('ST', 'São Tomé and Príncipe', '🇸🇹', '+239'),
  makeGenericCountry('SN', 'Senegal', '🇸🇳', '+221'),
  makeGenericCountry('RS', 'Serbia', '🇷🇸', '+381'),
  makeGenericCountry('SC', 'Seychelles', '🇸🇨', '+248'),
  makeGenericCountry('SL', 'Sierra Leone', '🇸🇱', '+232'),
  makeGenericCountry('SK', 'Slovakia', '🇸🇰', '+421'),
  makeGenericCountry('SI', 'Slovenia', '🇸🇮', '+386'),
  makeGenericCountry('SB', 'Solomon Islands', '🇸🇧', '+677'),
  makeGenericCountry('SO', 'Somalia', '🇸🇴', '+252'),
  makeGenericCountry('SS', 'South Sudan', '🇸🇸', '+211'),
  makeGenericCountry('ES', 'Spain', '🇪🇸', '+34'),
  makeGenericCountry('LK', 'Sri Lanka', '🇱🇰', '+94'),
  makeGenericCountry('SD', 'Sudan', '🇸🇩', '+249'),
  makeGenericCountry('SR', 'Suriname', '🇸🇷', '+597'),
  makeGenericCountry('SE', 'Sweden', '🇸🇪', '+46'),
  makeGenericCountry('CH', 'Switzerland', '🇨🇭', '+41'),
  makeGenericCountry('SY', 'Syria', '🇸🇾', '+963'),
  makeGenericCountry('TW', 'Taiwan', '🇹🇼', '+886'),
  makeGenericCountry('TJ', 'Tajikistan', '🇹🇯', '+992'),
  makeGenericCountry('TZ', 'Tanzania', '🇹🇿', '+255'),
  makeGenericCountry('TH', 'Thailand', '🇹🇭', '+66'),
  makeGenericCountry('TL', 'Timor-Leste', '🇹🇱', '+670'),
  makeGenericCountry('TG', 'Togo', '🇹🇬', '+228'),
  makeGenericCountry('TO', 'Tonga', '🇹🇴', '+676'),
  makeGenericCountry('TT', 'Trinidad and Tobago', '🇹🇹', '+1-868'),
  makeGenericCountry('TN', 'Tunisia', '🇹🇳', '+216'),
  makeGenericCountry('TR', 'Turkey', '🇹🇷', '+90'),
  makeGenericCountry('TM', 'Turkmenistan', '🇹🇲', '+993'),
  makeGenericCountry('TV', 'Tuvalu', '🇹🇻', '+688'),
  makeGenericCountry('UG', 'Uganda', '🇺🇬', '+256'),
  makeGenericCountry('UA', 'Ukraine', '🇺🇦', '+380'),
  makeGenericCountry('UY', 'Uruguay', '🇺🇾', '+598'),
  makeGenericCountry('UZ', 'Uzbekistan', '🇺🇿', '+998'),
  makeGenericCountry('VU', 'Vanuatu', '🇻🇺', '+678'),
  makeGenericCountry('VA', 'Vatican City', '🇻🇦', '+379'),
  makeGenericCountry('VE', 'Venezuela', '🇻🇪', '+58'),
  makeGenericCountry('VN', 'Vietnam', '🇻🇳', '+84'),
  makeGenericCountry('YE', 'Yemen', '🇾🇪', '+967'),
  makeGenericCountry('ZM', 'Zambia', '🇿🇲', '+260'),
  makeGenericCountry('ZW', 'Zimbabwe', '🇿🇼', '+263'),
];

// ---------------------------------------------------------------------------
// Combined sorted list (priority first, then alphabetical)
// ---------------------------------------------------------------------------

const ALL_COUNTRIES: CountryInfo[] = [
  ...PRIORITY_COUNTRIES,
  ...OTHER_COUNTRIES.filter(
    (c) => !PRIORITY_COUNTRIES.some((p) => p.code === c.code)
  ),
];

// ---------------------------------------------------------------------------
// Lookup cache for O(1) access
// ---------------------------------------------------------------------------

const _countryMap = new Map<string, CountryInfo>();
ALL_COUNTRIES.forEach((c) => _countryMap.set(c.code, c));

// ---------------------------------------------------------------------------
// Public helper functions
// ---------------------------------------------------------------------------

/** Get all countries (priority first, then alphabetical remainder) */
export function getAllCountries(): CountryInfo[] {
  return ALL_COUNTRIES;
}

/** Get the 20 priority countries */
export function getPriorityCountries(): CountryInfo[] {
  return PRIORITY_COUNTRIES;
}

/** Lookup a single country by ISO code */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return _countryMap.get(code.toUpperCase());
}

/** Get dynamic location field definitions for a country */
export function getLocationFieldsForCountry(code: string): LocationField[] {
  const country = getCountryByCode(code);
  return country?.locationFields || [];
}

/** Get the phone placeholder for a country (e.g. "+91 XXXXX XXXXX") */
export function formatPhonePlaceholder(code: string): string {
  const country = getCountryByCode(code);
  if (!country) return 'Phone number';
  return `${country.dialCode} ${country.phoneFormat}`;
}

/** Get the dial code for a country */
export function getDialCode(code: string): string {
  return getCountryByCode(code)?.dialCode || '';
}

/** Get date format for a country (e.g. "DD/MM/YYYY") */
export function getDateFormatForCountry(code: string): string {
  return getCountryByCode(code)?.dateFormat || 'DD/MM/YYYY';
}

/**
 * Format a structured location into a resume-ready address string.
 * Uses the country's addressFormat template, substituting {key} tokens
 * with the actual values from the locationFields map.
 *
 * Example (India):
 *   fields = { state: "Kerala", district: "Ernakulam", city: "Kochi", postalCode: "682001" }
 *   → "Kochi, Ernakulam, Kerala, India - 682001"
 */
export function formatAddressForResume(
  code: string,
  fields: Record<string, string>
): string {
  const country = getCountryByCode(code);
  if (!country) {
    // Fallback: just join non-empty values
    return Object.values(fields).filter(Boolean).join(', ');
  }

  let formatted = country.addressFormat;

  // Replace all {key} tokens with values from fields
  for (const [key, value] of Object.entries(fields)) {
    formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }

  // Replace any remaining unreplaced tokens with empty string
  formatted = formatted.replace(/\{[^}]+\}/g, '');

  // Clean up dangling separators and whitespace
  formatted = formatted
    .replace(/,\s*,/g, ',')          // double commas
    .replace(/\s+-\s*$/g, '')        // trailing " - " with no postal code
    .replace(/-\s*$/g, '')           // trailing "-"
    .replace(/,\s*$/g, '')          // trailing comma
    .replace(/^\s*,\s*/g, '')       // leading comma
    .replace(/\s{2,}/g, ' ')        // multiple spaces
    .trim();

  return formatted;
}
