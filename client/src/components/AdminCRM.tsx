import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  ShieldCheck, Users, LifeBuoy, TrendingUp, DollarSign, CheckCircle2, ShieldAlert,
  Globe, Settings, Plus, Search, Edit3, Save, PlusCircle, ArrowRight, Check, X,
  FileText, HelpCircle, ToggleLeft, ToggleRight
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

// Simulated registration and revenue historical chart metrics
const chartData = [
  { date: "Jun 14", users: 120, revenue: 450 },
  { date: "Jun 15", users: 135, revenue: 580 },
  { date: "Jun 16", users: 154, revenue: 790 },
  { date: "Jun 17", users: 172, revenue: 980 },
  { date: "Jun 18", users: 198, revenue: 1210 },
  { date: "Jun 19", users: 215, revenue: 1480 },
  { date: "Jun 20", users: 242, revenue: 1820 },
];

export default function AdminCRM() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'countries' | 'ats_rules'>('dashboard');

  // Country registry state
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [editModalTab, setEditModalTab] = useState<'general' | 'phone' | 'localization'>('general');

  const [countryForm, setCountryForm] = useState({
    code: '',
    name: '',
    flag: '🌐',
    dialCode: '',
    phoneFormat: '',
    phoneRegex: '',
    postalCodeLabel: 'Postal Code',
    postalCodeFormat: '',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: '{city}, {state}, {country} {postalCode}',
    nationality: '',
    isPriority: false,
    isActive: true
  });

  // ATS transition rules state
  const [atsSource, setAtsSource] = useState('');
  const [atsTarget, setAtsTarget] = useState('');
  const [atsKeywords, setAtsKeywords] = useState('');
  const [atsFormatting, setAtsFormatting] = useState('');
  const [atsExpectations, setAtsExpectations] = useState('');
  const [atsMappings, setAtsMappings] = useState<{ sourceKey: string; targetVal: string }[]>([]);

  const statsQuery = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  const usersQuery = trpc.admin.getUsers.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });
  const ticketsQuery = trpc.admin.getTickets.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const resolveTicketMutation = trpc.admin.resolveTicket.useMutation();

  // Load all countries (active and inactive) for admin
  const fetchAdminCountries = async () => {
    try {
      const res = await fetch('/countries/admin');
      if (res.ok) {
        const data = await res.json();
        setCountriesList(data);
      }
    } catch (e) {
      console.error("[Admin API] Failed to fetch countries list:", e);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminCountries();
    }
  }, [user]);

  // Load ATS rules when selection changes
  useEffect(() => {
    const loadAtsRules = async () => {
      if (!atsSource || !atsTarget) return;
      try {
        const res = await fetch(`/country-ats-rules/${atsSource}/${atsTarget}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const kw = typeof data.keywords === 'string' ? JSON.parse(data.keywords) : data.keywords;
            setAtsKeywords(Array.isArray(kw) ? kw.join(', ') : '');
            setAtsFormatting(data.preferredFormatting || '');
            setAtsExpectations(data.regionalHiringExpectations || '');
            
            const tm = typeof data.regionalTerminology === 'string' ? JSON.parse(data.regionalTerminology) : data.regionalTerminology;
            if (tm && typeof tm === 'object') {
              setAtsMappings(Object.entries(tm).map(([k, v]) => ({ sourceKey: k, targetVal: String(v) })));
            } else {
              setAtsMappings([]);
            }
          } else {
            // Preset default mapping layout
            setAtsKeywords('');
            setAtsFormatting('');
            setAtsExpectations('');
            setAtsMappings([
              { sourceKey: 'CV', targetVal: 'Resume' },
              { sourceKey: 'PIN Code', targetVal: 'ZIP Code' },
              { sourceKey: 'State', targetVal: 'State' },
              { sourceKey: 'District', targetVal: 'City' }
            ]);
          }
        }
      } catch (e) {
        console.error("[Admin API] Failed to load ATS rules:", e);
      }
    };
    loadAtsRules();
  }, [atsSource, atsTarget]);

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await resolveTicketMutation.mutateAsync({
        id: ticketId,
        status: "resolved",
      });
      toast.success("Support ticket marked as resolved!");
      ticketsQuery.refetch();
    } catch (e) {
      toast.error("Could not resolve support ticket");
    }
  };

  const toggleCountryStatus = async (id: number, field: 'isActive' | 'isPriority', currentVal: boolean) => {
    try {
      const res = await fetch(`/api/admin/countries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentVal })
      });
      if (res.ok) {
        toast.success(`Country ${field} toggled successfully!`);
        fetchAdminCountries();
      } else {
        toast.error("Failed to update country status");
      }
    } catch (e) {
      toast.error("Error communicating with admin API");
    }
  };

  const handleOpenEditModal = (country: any = null) => {
    setEditingCountry(country);
    setEditModalTab('general');
    if (country) {
      setCountryForm({
        code: country.code || '',
        name: country.name || '',
        flag: country.flag || '🌐',
        dialCode: country.dialCode || '',
        phoneFormat: country.phoneFormat || '',
        phoneRegex: country.phoneRegex || '',
        postalCodeLabel: country.postalCodeLabel || 'Postal Code',
        postalCodeFormat: country.postalCodeFormat || '',
        dateFormat: country.dateFormat || 'DD/MM/YYYY',
        addressFormat: country.addressFormat || '',
        nationality: country.nationality || '',
        isPriority: country.isPriority || false,
        isActive: country.isActive !== undefined ? country.isActive : true
      });
    } else {
      setCountryForm({
        code: '',
        name: '',
        flag: '🌐',
        dialCode: '',
        phoneFormat: '',
        phoneRegex: '',
        postalCodeLabel: 'Postal Code',
        postalCodeFormat: '',
        dateFormat: 'DD/MM/YYYY',
        addressFormat: '{city}, {state}, {country} {postalCode}',
        nationality: '',
        isPriority: false,
        isActive: true
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveCountry = async () => {
    if (!countryForm.code || !countryForm.name) {
      toast.error("Country Code and Name are required!");
      return;
    }
    try {
      const url = editingCountry ? `/api/admin/countries/${editingCountry.id}` : '/api/admin/countries';
      const method = editingCountry ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryForm)
      });
      if (res.ok) {
        toast.success(editingCountry ? "Country updated successfully!" : "Country added successfully!");
        setIsEditModalOpen(false);
        fetchAdminCountries();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save country details");
      }
    } catch (e) {
      toast.error("Error communicating with admin API");
    }
  };

  const handleSaveAtsRule = async () => {
    if (!atsSource || !atsTarget) {
      toast.error("Please select both source and target countries!");
      return;
    }
    const sourceObj = countriesList.find(c => c.code === atsSource);
    const targetObj = countriesList.find(c => c.code === atsTarget);
    if (!sourceObj || !targetObj) {
      toast.error("Invalid country selection");
      return;
    }

    const mappingObj: Record<string, string> = {};
    atsMappings.forEach(m => {
      if (m.sourceKey.trim()) {
        mappingObj[m.sourceKey.trim()] = m.targetVal.trim();
      }
    });

    const payload = {
      countryId: sourceObj.id,
      targetCountryId: targetObj.id,
      keywords: atsKeywords.split(',').map(k => k.trim()).filter(Boolean),
      preferredFormatting: atsFormatting,
      regionalHiringExpectations: atsExpectations,
      regionalTerminology: mappingObj
    };

    try {
      const res = await fetch('/api/admin/ats-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("ATS localization rule saved successfully!");
      } else {
        toast.error("Failed to save rules");
      }
    } catch (e) {
      toast.error("Error saving rules");
    }
  };

  const filteredCountries = countriesList.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = (statsQuery.data || {
    totalUsers: 0,
    totalGuests: 0,
    conversionRate: 0,
    activeUsers: 0,
    resumesCreated: 0,
    pdfDownloads: 0,
    subscriptionRevenue: 0,
  }) as any;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
          Loading administrative privileges...
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4 animate-fade-in">
        <Card className="w-full max-w-md border border-rose-200/80 shadow-2xl bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-rose-900 via-rose-950 to-red-950 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50/10 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-50/10 rounded-full blur-xl" />
            
            <ShieldAlert className="w-16 h-16 mx-auto mb-3 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" />
            <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              Access Denied
            </h3>
            <p className="text-xs text-rose-200/80 mt-2 font-medium">
              Protected Environment • Administrator Privileges Required
            </p>
          </div>
          <CardContent className="p-8 text-center text-slate-600 text-sm">
            You are logged in as <strong className="text-slate-800">{user?.name || "Guest"}</strong>. 
            This portal is restricted to system administrators. If you believe this is an error, contact technical support.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-md border border-slate-250 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            HexaCv Master Admin CRM
          </h2>
          <p className="text-slate-600 mt-1">
            Configure global localization, seed registry markets, tweak target ATS scanners, and manage support logs.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'countries' && (
            <Button onClick={() => handleOpenEditModal(null)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm text-xs py-2 h-9">
              <Plus className="w-4 h-4" />
              Add Country
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-250 gap-2 shrink-0 bg-white/40 backdrop-blur-sm p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-4 py-2 text-xs sm:text-sm font-bold border-b-2 -mb-[6px] transition-all flex items-center gap-1.5",
            activeTab === 'dashboard'
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Dashboard Overview
        </button>
        <button
          onClick={() => {
            setActiveTab('countries');
            fetchAdminCountries();
          }}
          className={cn(
            "px-4 py-2 text-xs sm:text-sm font-bold border-b-2 -mb-[6px] transition-all flex items-center gap-1.5",
            activeTab === 'countries'
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Globe className="w-4 h-4" />
          Global Country Registry
        </button>
        <button
          onClick={() => {
            setActiveTab('ats_rules');
            fetchAdminCountries();
          }}
          className={cn(
            "px-4 py-2 text-xs sm:text-sm font-bold border-b-2 -mb-[6px] transition-all flex items-center gap-1.5",
            activeTab === 'ats_rules'
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Settings className="w-4 h-4" />
          ATS Localization Rules
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'dashboard' && (
        <>
          {/* Grid Stats */}
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Registered Users
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-slate-850">{stats.totalUsers}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Guest Users
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-slate-850">{stats.totalGuests || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Conversion Rate
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-slate-850">{stats.conversionRate || 0}%</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Active Users (30d)
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-slate-850">{stats.activeUsers}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Resumes Created
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-slate-850">{stats.resumesCreated}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm border-emerald-100 bg-emerald-50/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Monthly Revenue
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-emerald-950 flex items-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mr-0.5" />
                  {stats.subscriptionRevenue}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Visual Analytics Chart */}
          <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Growth Performance Chart
              </CardTitle>
              <CardDescription>Visual stats for registrations and ARR progress (weekly delta)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" name="Active Users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Directory & Support Desk */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  HexaCv User Directory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Resumes</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((user: any) => (
                      <TableRow key={user.id} className="hover:bg-slate-55/40">
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs">{user.name}</div>
                          <div className="text-slate-500 text-[10px]">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.tier === "enterprise" ? "bg-indigo-50 border-indigo-200 text-indigo-800" :
                            user.tier === "pro" ? "bg-emerald-50 border-emerald-200 text-emerald-855" :
                            "bg-slate-100 text-slate-700"
                          }>
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{user.resumesCount} drafts</TableCell>
                        <TableCell>
                          <span className="text-xs uppercase font-medium">{user.role}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm text-slate-800 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  Pending Support Desk Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Details</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsQuery.data?.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-slate-55/40">
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs">{ticket.title}</div>
                          <div className="text-slate-500 text-[10px]">{ticket.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            ticket.priority === "high" ? "bg-red-50 text-red-800 border-red-200" : "bg-slate-100 text-slate-700"
                          }>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            ticket.status === "open" ? "bg-amber-55 text-amber-800 border-amber-250" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {ticket.status === "open" && (
                            <Button
                              onClick={() => handleResolveTicket(ticket.id)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] h-7 px-2"
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {ticketsQuery.data?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-500 italic">
                          Zero pending help tickets. Excellent customer satisfaction metrics!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'countries' && (
        <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Global Country Registry
                </CardTitle>
                <CardDescription>Verify validation rules, phone dialers, and localized formatting for {countriesList.length} territories.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9 bg-white border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>ISO Code</TableHead>
                  <TableHead>Dialer Prefix</TableHead>
                  <TableHead>Phone Format</TableHead>
                  <TableHead>Postcode Tag</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCountries.map((country) => (
                  <TableRow key={country.id} className="hover:bg-slate-55/40">
                    <TableCell className="font-semibold text-slate-850 text-xs flex items-center gap-2 py-3.5">
                      <span className="text-base select-none">{country.flag}</span>
                      <span>{country.name}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{country.code}</TableCell>
                    <TableCell className="text-xs text-slate-600">{country.dialCode}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{country.phoneFormat || "N/A"}</TableCell>
                    <TableCell className="text-xs text-slate-600">{country.postalCodeLabel || "N/A"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleCountryStatus(country.id, 'isPriority', country.isPriority)}
                        className="focus:outline-none"
                        title="Click to toggle priority status"
                      >
                        <Badge className={cn(
                          "cursor-pointer font-bold text-[10px] px-2 py-0.5 border",
                          country.isPriority 
                            ? "bg-amber-100 text-amber-850 hover:bg-amber-200 border-amber-250" 
                            : "bg-slate-100 text-slate-550 hover:bg-slate-200 border-slate-200"
                        )}>
                          {country.isPriority ? "Priority" : "Standard"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleCountryStatus(country.id, 'isActive', country.isActive)}
                        className="focus:outline-none"
                        title="Click to toggle active status"
                      >
                        <Badge className={cn(
                          "cursor-pointer font-bold text-[10px] px-2 py-0.5 border",
                          country.isActive 
                            ? "bg-emerald-100 text-emerald-850 hover:bg-emerald-250 border-emerald-250" 
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200"
                        )}>
                          {country.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(country)}
                        className="h-8 text-[11px] font-semibold border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCountries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500 italic text-xs">
                      No countries match your search parameters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ats_rules' && (
        <Card className="shadow-sm border-slate-200 bg-white/70 backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              Regional ATS Optimization Rules
            </CardTitle>
            <CardDescription>
              Tweak keyword suggestions, terminology conversion mapping profiles, and formatting guides for candidates applying to cross-border roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Country Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
              <div className="space-y-2">
                <Label htmlFor="ats-source-country" className="text-xs font-bold text-slate-700">Source Candidate Residence</Label>
                <select
                  id="ats-source-country"
                  value={atsSource}
                  onChange={(e) => setAtsSource(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  <option value="">Select current country...</option>
                  {countriesList.map(c => (
                    <option key={c.id} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ats-target-country" className="text-xs font-bold text-slate-700">Target Employment Market</Label>
                <select
                  id="ats-target-country"
                  value={atsTarget}
                  onChange={(e) => setAtsTarget(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  <option value="">Select target country...</option>
                  {countriesList.map(c => (
                    <option key={c.id} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {atsSource && atsTarget ? (
              <div className="space-y-6 pt-2 animate-fade-in">
                {/* 1. Target ATS Keywords */}
                <div className="space-y-1.5">
                  <Label htmlFor="ats-rules-keywords" className="text-xs font-bold text-slate-700">Target ATS Keywords (Comma-separated)</Label>
                  <Input
                    id="ats-rules-keywords"
                    placeholder="e.g. Managed, Led, Optimized, SaaS, Cross-functional Collaboration"
                    value={atsKeywords}
                    onChange={(e) => setAtsKeywords(e.target.value)}
                    className="bg-white border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">These keywords are appended to the job descriptions scanner to guide cross-border candidates.</p>
                </div>

                {/* 2. Formatting Guidelines */}
                <div className="space-y-1.5">
                  <Label htmlFor="ats-rules-formatting" className="text-xs font-bold text-slate-700">Preferred Formatting Guidelines</Label>
                  <Textarea
                    id="ats-rules-formatting"
                    placeholder="e.g. Single page layout, Arial or Calibri font, 0.5 - 1 inch margins, standard US letter size (8.5x11 inches)."
                    value={atsFormatting}
                    onChange={(e) => setAtsFormatting(e.target.value)}
                    rows={3}
                    className="bg-white border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* 3. Regional Expectations */}
                <div className="space-y-1.5">
                  <Label htmlFor="ats-rules-expectations" className="text-xs font-bold text-slate-700">Regional Hiring Expectations</Label>
                  <Textarea
                    id="ats-rules-expectations"
                    placeholder="e.g. US recruiters expect results-oriented bullet points containing metrics. Keep the resume strictly to 1 page for less than 8 years of experience."
                    value={atsExpectations}
                    onChange={(e) => setAtsExpectations(e.target.value)}
                    rows={3}
                    className="bg-white border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* 4. Terminology Mappings */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700">Regional Terminology Mappings</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAtsMappings([...atsMappings, { sourceKey: '', targetVal: '' }])}
                      className="h-8 text-[11px] font-semibold border-slate-250 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Add Translation
                    </Button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="w-1/2">Source Term (Candidate Residence)</TableHead>
                          <TableHead className="w-1/2">Target Term (Job Market Translation)</TableHead>
                          <TableHead className="w-12 text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {atsMappings.map((mapping, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="p-2">
                              <Input
                                placeholder="e.g. PIN Code"
                                value={mapping.sourceKey}
                                onChange={(e) => {
                                  const next = [...atsMappings];
                                  next[idx].sourceKey = e.target.value;
                                  setAtsMappings(next);
                                }}
                                className="h-8 text-xs bg-white border-slate-200"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                placeholder="e.g. ZIP Code"
                                value={mapping.targetVal}
                                onChange={(e) => {
                                  const next = [...atsMappings];
                                  next[idx].targetVal = e.target.value;
                                  setAtsMappings(next);
                                }}
                                className="h-8 text-xs bg-white border-slate-200"
                              />
                            </TableCell>
                            <TableCell className="p-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setAtsMappings(atsMappings.filter((_, i) => i !== idx))}
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {atsMappings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-455 italic">
                              No translation terminology mapped. Click "Add Translation" to insert conversions.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Save rules footer */}
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <Button 
                    onClick={handleSaveAtsRule} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm text-xs py-2 h-9"
                  >
                    <Save className="w-4 h-4" />
                    Save Rule Configuration
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-250 rounded-2xl bg-slate-50/20">
                <HelpCircle className="w-12 h-12 text-slate-400 mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Select Country Target Transition</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a Source residence country and a Target employment country above to load or create localized rules.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── HIGH FIDELITY EDIT COUNTRY MODAL ────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md border border-slate-250 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-850">
                  {editingCountry ? `Modify Territory: ${editingCountry.name}` : "Registry New Country"}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Configure flags, regex patterns, and address layouts.</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Mini Tabs */}
            <div className="flex border-b border-slate-150 gap-2 p-1 bg-slate-55 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setEditModalTab('general')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  editModalTab === 'general' ? "bg-white text-emerald-850 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                General Settings
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('phone')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  editModalTab === 'phone' ? "bg-white text-emerald-850 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Phone & Postcode
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('localization')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  editModalTab === 'localization' ? "bg-white text-emerald-850 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Localization Setup
              </button>
            </div>

            {/* Modal Form body */}
            <div className="flex-1 space-y-4 py-2">
              {editModalTab === 'general' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-code" className="text-xs font-bold text-slate-700">ISO Country Code (2 letters)</Label>
                    <Input
                      id="country-modal-code"
                      placeholder="e.g. DE"
                      maxLength={2}
                      disabled={!!editingCountry}
                      value={countryForm.code}
                      onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-name" className="text-xs font-bold text-slate-700">Country Name</Label>
                    <Input
                      id="country-modal-name"
                      placeholder="e.g. Germany"
                      value={countryForm.name}
                      onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-flag" className="text-xs font-bold text-slate-700">Emoji Flag Glyph</Label>
                    <Input
                      id="country-modal-flag"
                      placeholder="e.g. 🇩🇪"
                      value={countryForm.flag}
                      onChange={(e) => setCountryForm({ ...countryForm, flag: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-nationality" className="text-xs font-bold text-slate-700">Nationality (Adjective)</Label>
                    <Input
                      id="country-modal-nationality"
                      placeholder="e.g. German"
                      value={countryForm.nationality}
                      onChange={(e) => setCountryForm({ ...countryForm, nationality: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-200 mt-2">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        id="country-modal-priority"
                        checked={countryForm.isPriority}
                        onChange={(e) => setCountryForm({ ...countryForm, isPriority: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350"
                      />
                      <Label htmlFor="country-modal-priority" className="text-xs font-semibold text-slate-700 cursor-pointer">Priority Target Country</Label>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        id="country-modal-active"
                        checked={countryForm.isActive}
                        onChange={(e) => setCountryForm({ ...countryForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350"
                      />
                      <Label htmlFor="country-modal-active" className="text-xs font-semibold text-slate-700 cursor-pointer">Enable status (Is Active)</Label>
                    </div>
                  </div>
                </div>
              )}

              {editModalTab === 'phone' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="country-modal-dial" className="text-xs font-bold text-slate-700">Dial Code Prefix</Label>
                      <Input
                        id="country-modal-dial"
                        placeholder="e.g. +49"
                        value={countryForm.dialCode}
                        onChange={(e) => setCountryForm({ ...countryForm, dialCode: e.target.value })}
                        className="bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country-modal-phoneformat" className="text-xs font-bold text-slate-700">Phone Format Template</Label>
                      <Input
                        id="country-modal-phoneformat"
                        placeholder="e.g. XXX XXXXXXX"
                        value={countryForm.phoneFormat}
                        onChange={(e) => setCountryForm({ ...countryForm, phoneFormat: e.target.value })}
                        className="bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-phoneregex" className="text-xs font-bold text-slate-700">Phone Regex Validation pattern</Label>
                    <Input
                      id="country-modal-phoneregex"
                      placeholder="e.g. ^1[567]\d{8,9}$"
                      value={countryForm.phoneRegex}
                      onChange={(e) => setCountryForm({ ...countryForm, phoneRegex: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">Enforces validation formatting constraints during user contact entry.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="country-modal-postallabel" className="text-xs font-bold text-slate-700">Postal Code Label</Label>
                      <Input
                        id="country-modal-postallabel"
                        placeholder="e.g. ZIP Code or PIN Code"
                        value={countryForm.postalCodeLabel}
                        onChange={(e) => setCountryForm({ ...countryForm, postalCodeLabel: e.target.value })}
                        className="bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country-modal-postalformat" className="text-xs font-bold text-slate-700">Postal Code Format Help</Label>
                      <Input
                        id="country-modal-postalformat"
                        placeholder="e.g. 5 digits or e.g. K1A 0B1"
                        value={countryForm.postalCodeFormat}
                        onChange={(e) => setCountryForm({ ...countryForm, postalCodeFormat: e.target.value })}
                        className="bg-white border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editModalTab === 'localization' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-date" className="text-xs font-bold text-slate-700">Regional Date Format</Label>
                    <select
                      id="country-modal-date"
                      value={countryForm.dateFormat}
                      onChange={(e) => setCountryForm({ ...countryForm, dateFormat: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 21/06/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/21/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-21)</option>
                      <option value="YYYY.MM.DD">YYYY.MM.DD (e.g. 2026.06.21)</option>
                      <option value="DD.MM.YYYY">DD.MM.YYYY (e.g. 21.06.2026)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 font-medium">Re-formats candidate experience/dates to match this structure in dynamic templates.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country-modal-address" className="text-xs font-bold text-slate-700">Address Header Template</Label>
                    <Input
                      id="country-modal-address"
                      placeholder="e.g. {city}, {state}, {country} - {postalCode}"
                      value={countryForm.addressFormat}
                      onChange={(e) => setCountryForm({ ...countryForm, addressFormat: e.target.value })}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                    <div className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong>Variable tags allowed:</strong>
                      <div className="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[9px] text-emerald-800">
                        <span>{"{city}"} - City Name</span>
                        <span>{"{state}"} - State/Region/Province</span>
                        <span>{"{district}"} - Local District</span>
                        <span>{"{postalCode}"} - ZIP/PIN/Postcode</span>
                        <span>{"{country}"} - Territory name</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                className="h-9 px-4 text-xs border-slate-200 rounded-lg hover:bg-slate-50 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCountry}
                className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
