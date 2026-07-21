import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, MapPin, Phone, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CountryLocationFieldsProps {
  countryCode: string;
  locationFields: Record<string, string>;
  phone: string;
  onCountryChange: (code: string) => void;
  onLocationFieldChange: (fields: Record<string, string>) => void;
  onPhoneChange: (phone: string) => void;
  onLocationStringChange: (formatted: string) => void;
  compact?: boolean;
  
  // Target country additions
  targetCountryCode?: string;
  onTargetCountryChange?: (code: string) => void;

  // Raw location
  location?: string;
}

export default function CountryLocationFields({
  countryCode,
  locationFields,
  phone,
  onCountryChange,
  onLocationFieldChange,
  onPhoneChange,
  onLocationStringChange,
  compact = false,
  targetCountryCode = '',
  onTargetCountryChange,
  location = '',
}: CountryLocationFieldsProps) {
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isTargetCountryOpen, setIsTargetCountryOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const targetSearchRef = useRef<HTMLInputElement>(null);

  // Fetch countries list from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('/countries');
        if (res.ok) {
          const data = await res.json();
          setCountriesList(data);
        }
      } catch (err) {
        console.error('Failed to fetch countries list:', err);
      }
    };
    fetchCountries();
  }, []);

  // Fetch states/provinces list when current country code changes
  useEffect(() => {
    if (!countryCode) {
      setStatesList([]);
      setDistrictsList([]);
      return;
    }
    const fetchStates = async () => {
      try {
        const res = await fetch(`/countries/${countryCode}/states`);
        if (res.ok) {
          const data = await res.json();
          setStatesList(data);
          setDistrictsList([]); // clear districts on country switch
        }
      } catch (err) {
        console.error('Failed to fetch states list:', err);
      }
    };
    fetchStates();
  }, [countryCode]);

  // Fetch districts when state selection changes (India specific)
  const selectedStateObj = useMemo(() => {
    return statesList.find(s => s.name === locationFields.state);
  }, [statesList, locationFields.state]);

  useEffect(() => {
    if (!selectedStateObj || countryCode !== 'IN') {
      setDistrictsList([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await fetch(`/states/${selectedStateObj.id}/districts`);
        if (res.ok) {
          const data = await res.json();
          setDistrictsList(data);
        }
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      }
    };
    fetchDistricts();
  }, [selectedStateObj, countryCode]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(e.target as Node)) {
        setIsTargetCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search inputs
  useEffect(() => {
    if (isCountryOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isCountryOpen]);

  useEffect(() => {
    if (isTargetCountryOpen && targetSearchRef.current) {
      setTimeout(() => targetSearchRef.current?.focus(), 50);
    }
  }, [isTargetCountryOpen]);

  const selectedCountry = useMemo(() => countriesList.find((c) => c.code === countryCode), [countriesList, countryCode]);
  const selectedTargetCountry = useMemo(() => countriesList.find((c) => c.code === targetCountryCode), [countriesList, targetCountryCode]);

  const priorityCountries = useMemo(() => countriesList.filter((c) => c.isPriority), [countriesList]);
  const otherCountries = useMemo(() => countriesList.filter((c) => !c.isPriority), [countriesList]);

  // Search filter lists
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return countriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [searchQuery, countriesList]);

  const filteredTargetCountries = useMemo(() => {
    if (!targetSearchQuery.trim()) return null;
    const q = targetSearchQuery.toLowerCase();
    return countriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [targetSearchQuery, countriesList]);

  // Address Composition
  const composeAddress = (country: any, fields: Record<string, string>) => {
    if (!country) return Object.values(fields).filter(Boolean).join(', ');
    let formatted = country.addressFormat;
    
    formatted = formatted.replace(/{state}/g, fields.state || '');
    formatted = formatted.replace(/{district}/g, fields.district || '');
    formatted = formatted.replace(/{city}/g, fields.city || '');
    formatted = formatted.replace(/{postalCode}/g, fields.postalCode || '');
    formatted = formatted.replace(/{country}/g, country.name || '');

    // Clean formatting syntax
    return formatted
      .replace(/,\s*,/g, ',')
      .replace(/\s+-\s*$/g, '')
      .replace(/-\s*$/g, '')
      .replace(/,\s*$/g, '')
      .replace(/^\s*,\s*/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // Phone Validation
  const validatePhone = (num: string, country: any) => {
    if (!num || !country || !country.phoneRegex) {
      setPhoneError(null);
      return;
    }
    const local = num.startsWith(country.dialCode)
      ? num.slice(country.dialCode.length).trim()
      : num.trim();
    
    if (!local) {
      setPhoneError(null);
      return;
    }

    const regex = new RegExp(country.phoneRegex);
    if (!regex.test(local)) {
      setPhoneError(`Invalid format for ${country.name}. Pattern: ${country.phoneFormat}`);
    } else {
      setPhoneError(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCountrySelect = (code: string) => {
    const nextC = countriesList.find(c => c.code === code);
    onCountryChange(code);
    setIsCountryOpen(false);
    setSearchQuery('');
    onLocationFieldChange({});
    onLocationStringChange('');

    if (nextC) {
      const oldDial = selectedCountry?.dialCode || '';
      const newDial = nextC.dialCode;
      
      let cleanPhone = phone.trim();
      if (oldDial && cleanPhone.startsWith(oldDial)) {
        cleanPhone = cleanPhone.slice(oldDial.length).trim();
      } else if (cleanPhone.startsWith(newDial)) {
        cleanPhone = cleanPhone.slice(newDial.length).trim();
      } else if (cleanPhone.startsWith('+')) {
        const match = cleanPhone.match(/^\+\d+\s*/);
        if (match) {
          cleanPhone = cleanPhone.slice(match[0].length).trim();
        }
      }
      
      onPhoneChange(newDial + ' ' + cleanPhone);
    }
  };

  const handleTargetCountrySelect = (code: string) => {
    if (onTargetCountryChange) {
      onTargetCountryChange(code);
    }
    setIsTargetCountryOpen(false);
    setTargetSearchQuery('');
  };

  const handleLocationFieldUpdate = (key: string, value: string) => {
    const updated = { ...locationFields, [key]: value };
    onLocationFieldChange(updated);
    if (selectedCountry) {
      const formatted = composeAddress(selectedCountry, updated);
      onLocationStringChange(formatted);
    }
  };

  const handlePhoneUpdate = (value: string) => {
    onPhoneChange(value);
    if (selectedCountry) {
      validatePhone(value, selectedCountry);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────

  const labelCls = compact ? 'text-xs' : 'text-sm font-semibold text-slate-700';
  const gapCls = compact ? 'gap-3' : 'gap-4';

  const renderCountryItem = (country: any, isTarget: boolean) => (
    <button
      key={country.code}
      type="button"
      onClick={() => isTarget ? handleTargetCountrySelect(country.code) : handleCountrySelect(country.code)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-all rounded-lg my-0.5',
        'hover:bg-emerald-50 hover:text-emerald-950 hover:translate-x-1 duration-150',
        (isTarget ? targetCountryCode : countryCode) === country.code 
          ? 'bg-emerald-600 text-white font-semibold' 
          : 'text-slate-700'
      )}
    >
      <span className="text-base leading-none shrink-0">{country.flag}</span>
      <span className="flex-1 truncate font-medium">{country.name}</span>
      <span className={cn('text-[10px] font-mono shrink-0', (isTarget ? targetCountryCode : countryCode) === country.code ? 'text-emerald-100' : 'text-slate-400')}>{country.dialCode}</span>
    </button>
  );

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Current Residence Country Selector */}
        <div className="space-y-1.5">
          <Label className={cn(labelCls, 'flex items-center gap-1.5')}>
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Current Country
          </Label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className={cn(
                'w-full flex items-center gap-2 h-10 px-3 rounded-lg border text-sm text-left transition-all',
                'bg-slate-50/50 border-slate-200 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                isCountryOpen && 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white shadow-sm'
              )}
            >
              {selectedCountry ? (
                <>
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="flex-1 font-medium text-slate-800 truncate">{selectedCountry.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{selectedCountry.dialCode}</span>
                </>
              ) : (
                <span className="flex-1 text-slate-400">Select current residence…</span>
              )}
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-400 transition-transform shrink-0',
                isCountryOpen && 'rotate-180 text-emerald-500'
              )} />
            </button>

            {isCountryOpen && (
              <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search countries…"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-52 p-1">
                  {filteredCountries ? (
                    filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => renderCountryItem(c, false))
                    ) : (
                      <p className="text-center text-xs text-slate-400 py-3">No matching countries</p>
                    )
                  ) : (
                    <>
                      <p className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Popular Markets</p>
                      {priorityCountries.map((c) => renderCountryItem(c, false))}
                      <div className="my-1 border-t border-slate-100" />
                      <p className="px-2.5 pt-1 pb-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">All Regions</p>
                      {otherCountries.map((c) => renderCountryItem(c, false))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Target Employment Country Selector */}
        {onTargetCountryChange && (
          <div className="space-y-1.5">
            <Label className={cn(labelCls, 'flex items-center gap-1.5')}>
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Target Employment Country
            </Label>
            <div className="relative" ref={targetDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTargetCountryOpen(!isTargetCountryOpen)}
                className={cn(
                  'w-full flex items-center gap-2 h-10 px-3 rounded-lg border text-sm text-left transition-all',
                  'bg-slate-50/50 border-slate-200 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                  isTargetCountryOpen && 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-sm'
                )}
              >
                {selectedTargetCountry ? (
                  <>
                    <span className="text-base leading-none">{selectedTargetCountry.flag}</span>
                    <span className="flex-1 font-medium text-slate-800 truncate">{selectedTargetCountry.name}</span>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full shrink-0 font-semibold">{selectedTargetCountry.nationality} CV</span>
                  </>
                ) : (
                  <span className="flex-1 text-slate-450 italic">Same as current residence</span>
                )}
                <ChevronDown className={cn(
                  'w-4 h-4 text-slate-400 transition-transform shrink-0',
                  isTargetCountryOpen && 'rotate-180 text-indigo-500'
                )} />
              </button>

              {isTargetCountryOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="sticky top-0 bg-white border-b border-slate-100 p-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        ref={targetSearchRef}
                        type="text"
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        placeholder="Search target countries…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-52 p-1">
                    {filteredTargetCountries ? (
                      filteredTargetCountries.length > 0 ? (
                        filteredTargetCountries.map((c) => renderCountryItem(c, true))
                      ) : (
                        <p className="text-center text-xs text-slate-400 py-3">No matching countries</p>
                      )
                    ) : (
                      <>
                        <p className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Popular Targets</p>
                        {priorityCountries.map((c) => renderCountryItem(c, true))}
                        <div className="my-1 border-t border-slate-100" />
                        <p className="px-2.5 pt-1 pb-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">All Targets</p>
                        {otherCountries.map((c) => renderCountryItem(c, true))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Phone Number with automatic validation feedback */}
      <div className="space-y-1.5">
        <Label className={cn(labelCls, 'flex items-center gap-1.5')}>
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          Phone Number
        </Label>
        {selectedCountry ? (
          <div className="relative">
            <div className="absolute left-0 top-0 h-full flex items-center pl-3.5 pointer-events-none border-r border-slate-150 pr-2">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="text-base leading-none">{selectedCountry.flag}</span>
                <span className="font-semibold font-mono text-xs">{selectedCountry.dialCode}</span>
              </span>
            </div>
            <Input
              id="country-phone"
              value={phone.startsWith(selectedCountry.dialCode) ? phone.slice(selectedCountry.dialCode.length).trim() : phone}
              placeholder={selectedCountry.phoneFormat}
              onChange={(e) => {
                const val = e.target.value;
                handlePhoneUpdate(selectedCountry.dialCode + ' ' + val);
              }}
              className={cn("pl-20 border-slate-200 rounded-lg", phoneError && "border-amber-300 focus-visible:ring-amber-500/20 focus-visible:border-amber-400")}
            />
          </div>
        ) : (
          <Input
            id="country-phone"
            value={phone}
            placeholder="e.g. +1 (555) 019-2834"
            onChange={(e) => handlePhoneUpdate(e.target.value)}
            className="border-slate-200 rounded-lg"
          />
        )}
        {selectedCountry && phoneError && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>{phoneError}</span>
          </div>
        )}
      </div>

      {/* 4. Subdivisions Location Details */}
      {selectedCountry && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <Label className={cn(labelCls, 'flex items-center gap-1.5 text-slate-650')}>
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Address Details</span>
            <span className="text-[10px] text-slate-450 font-normal ml-1">
              (Formats as: {selectedCountry.name} region)
            </span>
          </Label>

          <div className={cn('grid grid-cols-1 md:grid-cols-2', gapCls)}>
            
            {/* Conditional State Dropdown or input */}
            {statesList.length > 0 ? (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium">
                  {countryCode === 'AE' ? 'Emirate' : countryCode === 'CA' ? 'Province / Territory' : countryCode === 'GB' ? 'Country / Nation' : 'State'}
                  <span className="text-red-400 ml-0.5">*</span>
                </Label>
                <Select
                  value={locationFields.state || ''}
                  onValueChange={(val) => handleLocationFieldUpdate('state', val)}
                >
                  <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs bg-slate-50/30">
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {statesList.map((st) => (
                      <SelectItem key={st.id} value={st.name} className="text-xs">
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium">State / Province</Label>
                <Input
                  value={locationFields.state || ''}
                  placeholder="e.g. State name"
                  className="h-9 border-slate-200 rounded-lg text-xs"
                  onChange={(e) => handleLocationFieldUpdate('state', e.target.value)}
                />
              </div>
            )}

            {/* India District Selector */}
            {countryCode === 'IN' && districtsList.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium">District</Label>
                <Select
                  value={locationFields.district || ''}
                  onValueChange={(val) => handleLocationFieldUpdate('district', val)}
                >
                  <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs bg-slate-50/30">
                    <SelectValue placeholder="Select district..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {districtsList.map((dst) => (
                      <SelectItem key={dst.id} value={dst.name} className="text-xs">
                        {dst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* City input */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-medium">
                City <span className="text-red-400 ml-0.5">*</span>
              </Label>
              <Input
                value={locationFields.city || ''}
                placeholder="e.g. Kochi or Chicago"
                className="h-9 border-slate-200 rounded-lg text-xs"
                onChange={(e) => handleLocationFieldUpdate('city', e.target.value)}
              />
            </div>

            {/* Postal Code input (uses localized labels) */}
            {selectedCountry.postalCodeLabel !== 'N/A' && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium">
                  {selectedCountry.postalCodeLabel}
                  <span className="text-red-400 ml-0.5">*</span>
                </Label>
                <Input
                  value={locationFields.postalCode || ''}
                  placeholder={selectedCountry.postalCodeFormat || 'e.g. 10001'}
                  className="h-9 border-slate-200 rounded-lg text-xs"
                  onChange={(e) => handleLocationFieldUpdate('postalCode', e.target.value)}
                />
              </div>
            )}

          </div>

          {/* Formatted Resume Address Preview Card */}
          {Object.values(locationFields).some(Boolean) && (
            <Card className="bg-emerald-50/30 border border-emerald-100 rounded-xl overflow-hidden mt-3 shadow-none">
              <CardContent className="p-3 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mb-0.5">Resume Address Composition</p>
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                    {composeAddress(selectedCountry, locationFields) || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}

      {!selectedCountry && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className={cn(labelCls, 'flex items-center gap-1.5')}>
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Location (City, State, Country)
            </Label>
            <Input
              id="raw-location"
              value={location}
              placeholder="e.g. San Francisco, CA"
              onChange={(e) => onLocationStringChange(e.target.value)}
              className="border-slate-200 rounded-lg text-sm bg-slate-50/50 dark:bg-white/5"
            />
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-50/60 border border-dashed border-slate-200 rounded-xl dark:bg-white/5 dark:border-white/10">
            <MapPin className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your Current Country to view state/region mapping and automatic code helpers.</p>
          </div>
        </div>
      )}
    </div>
  );
}
