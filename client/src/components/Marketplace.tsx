import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Star, Download, Tag, Plus, ShoppingCart, Check, Sparkles, Eye, FileText, PenLine, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
};

interface MarketplaceProps {
  resumes: any[];
  onCloneResume: (parsedContent: any) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'template', label: 'Templates', icon: FileText },
  { id: 'resume', label: 'Cover Letters', icon: PenLine },
  { id: 'review', label: 'Reviews', icon: Users },
  { id: 'coaching', label: 'Coaching', icon: Briefcase },
];

export default function Marketplace({ resumes, onCloneResume }: MarketplaceProps) {
  const listItemsQuery = trpc.marketplace.list.useQuery({ type: "resume" });
  const downloadMutation = trpc.marketplace.download.useMutation();

  const [category, setCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const items = useMemo(() => {
    const data = listItemsQuery.data || [];
    if (category === 'all') return data;
    return data.filter((i: any) => i.type === category);
  }, [listItemsQuery.data, category]);

  const handleBuy = async (item: any) => {
    try {
      await downloadMutation.mutateAsync({ id: item.id });
      toast.success(`Purchased "${item.title}"!`);
      if (item.type === "resume" || item.type === "template") {
        try {
          const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
          onCloneResume(parsed);
        } catch {
          toast.success("Added to your library");
        }
      }
      listItemsQuery.refetch();
      setPurchaseOpen(false);
      setSelectedItem(null);
    } catch (e: any) {
      toast.error("Failed to process");
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Marketplace
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Browse templates, cover letters, and coaching services.
        </p>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto sm:flex-wrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap border transition"
              style={{
                backgroundColor: active ? T.primary : T.surface,
                borderColor: active ? T.primary : T.outlineVariant,
                color: active ? '#fff' : T.text,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="group rounded-xl border overflow-hidden transition hover:scale-[1.02]"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
          >
            {/* Thumbnail area */}
            <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor: T.elevated }}>
              <Tag className="h-8 w-8" style={{ color: T.muted }} />
              <button className="absolute top-2 right-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                <Eye className="h-3 w-3" /> Quick Preview
              </button>
              <span
                className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: item.price === 0 ? `${T.success}20` : `${T.accent}20`,
                  color: item.price === 0 ? T.success : T.accent,
                }}
              >
                {item.price === 0 ? 'Free' : `$${(item.price / 100).toFixed(2)}`}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-bold truncate" style={{ color: T.text }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: T.muted }}>{item.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs" style={{ color: T.muted }}>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-500" />{item.rating || '5.0'}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{item.downloads || 0}</span>
              </div>

              <button
                onClick={() => handleBuy(item)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:opacity-90"
                style={{
                  backgroundColor: item.price === 0 ? T.primary : T.accent,
                  color: '#fff',
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {item.price === 0 ? 'Get' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3">
          <Sparkles className="h-10 w-10" style={{ color: T.muted }} />
          <p className="text-sm font-bold" style={{ color: T.text }}>No items yet</p>
          <p className="text-xs" style={{ color: T.muted }}>Marketplace items will appear here.</p>
        </div>
      )}
    </div>
  );
}
