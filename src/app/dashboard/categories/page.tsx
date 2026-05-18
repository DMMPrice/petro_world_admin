'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, FolderOpen, Layers, X, Check,
  ChevronRight, Search, AlertCircle,
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Inline editable row ────────────────────────────────────────────────────
function EditableRow({
  value,
  onSave,
  onCancel,
  placeholder,
  autoFocus = true,
}: {
  value: string;
  onSave: (v: string) => Promise<boolean>;
  onCancel: () => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="flex items-center gap-2 animate-fade-in-up">
      <Input
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm border-amber-300 focus:border-amber-500 focus:ring-amber-400/20"
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button
        onClick={save}
        disabled={saving || !text.trim()}
        className="h-8 w-8 flex items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-all flex-shrink-0"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onCancel}
        className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CategoriesPage() {
  const {
    categories, addCategory, updateCategory, deleteCategory,
    subCategories, addSubCategory, updateSubCategory, deleteSubCategory,
    loading,
  } = useData();

  // ── Category state ─────────────────────────────────────────────────────
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // ── Subcategory state ──────────────────────────────────────────────────
  const [subSearch, setSubSearch] = useState('');
  const [addingSub, setAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  // For "move subcategory to another category"
  const [movingSubId, setMovingSubId] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCatId) ?? null;

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.title.toLowerCase().includes(catSearch.toLowerCase())),
    [categories, catSearch]
  );

  const filteredSubCategories = useMemo(() => {
    const base = selectedCatId
      ? subCategories.filter((s) => s.category_id === selectedCatId)
      : subCategories;
    return base.filter((s) => s.name.toLowerCase().includes(subSearch.toLowerCase()));
  }, [subCategories, selectedCatId, subSearch]);

  const subCountFor = (id: string) => subCategories.filter((s) => s.category_id === id).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="text-slate-500 mt-1">Organise your product catalogue with categories and subcategories.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-2">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
            <p className="text-xs text-slate-500 font-medium">Categories</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{subCategories.length}</p>
            <p className="text-xs text-slate-500 font-medium">Subcategories</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-3">

        {/* ── LEFT: Categories ────────────────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  Categories
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Click a category to filter subcategories
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => { setAddingCat(true); setEditingCatId(null); }}
                className="gap-1.5 bg-amber-500 hover:bg-amber-600 h-8 text-xs shadow-sm shadow-amber-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search categories…"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="pl-9 h-8 text-sm border-slate-200"
              />
              {catSearch && (
                <button onClick={() => setCatSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">

              {/* "Add new category" inline row */}
              {addingCat && (
                <div className="px-4 py-3 bg-amber-50/50 border-b border-amber-100">
                  <EditableRow
                    value=""
                    placeholder="Category name…"
                    onSave={async (title) => {
                      const ok = await addCategory(title);
                      if (ok) setAddingCat(false);
                      return ok;
                    }}
                    onCancel={() => setAddingCat(false)}
                  />
                </div>
              )}

              {filteredCategories.length === 0 && !addingCat && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <FolderOpen className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    {catSearch ? 'No categories match your search' : 'No categories yet'}
                  </p>
                  {!catSearch && (
                    <Button size="sm" variant="outline" onClick={() => setAddingCat(true)} className="mt-3 text-xs gap-1">
                      <Plus className="w-3 h-3" /> Create your first category
                    </Button>
                  )}
                </div>
              )}

              {filteredCategories.map((cat, idx) => {
                const isSelected = selectedCatId === cat.id;
                const isEditing = editingCatId === cat.id;
                const count = subCountFor(cat.id);

                return (
                  <div
                    key={cat.id}
                    className={cn(
                      'group px-4 py-3 flex items-center gap-3 transition-colors duration-150 animate-fade-in-up cursor-pointer',
                      isSelected ? 'bg-amber-50 border-l-2 border-amber-500' : 'hover:bg-slate-50 border-l-2 border-transparent',
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    onClick={() => !isEditing && setSelectedCatId(isSelected ? null : cat.id)}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                      isSelected ? 'bg-amber-100' : 'bg-slate-100 group-hover:bg-amber-50'
                    )}>
                      <FolderOpen className={cn('w-4 h-4', isSelected ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500')} />
                    </div>

                    {isEditing ? (
                      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <EditableRow
                          value={cat.title}
                          placeholder="Category name…"
                          onSave={async (title) => updateCategory(cat.id, title)}
                          onCancel={() => setEditingCatId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold truncate', isSelected ? 'text-amber-700' : 'text-slate-800')}>
                            {cat.title}
                          </p>
                          <p className="text-xs text-slate-400">{count} subcategor{count === 1 ? 'y' : 'ies'}</p>
                        </div>

                        {isSelected && <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingCatId(cat.id); setAddingCat(false); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-sm">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <AlertDialogTitle>Delete "{cat.title}"?</AlertDialogTitle>
                                  <AlertDialogDescription className="mt-1">
                                    {count > 0 && (
                                      <span className="flex items-center gap-1.5 text-amber-600 font-medium mb-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        This will also delete {count} subcategor{count === 1 ? 'y' : 'ies'}.
                                      </span>
                                    )}
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                <AlertDialogCancel className="border-slate-200 h-8 text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => { deleteCategory(cat.id); if (selectedCatId === cat.id) setSelectedCatId(null); }}
                                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── RIGHT: Sub-categories ───────────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Subcategories
                  {selectedCategory && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-semibold ml-1">
                      {selectedCategory.title}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {selectedCategory
                    ? `Subcategories under "${selectedCategory.title}"`
                    : 'Select a category to filter, or view all'}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => { setAddingSub(true); setEditingSubId(null); }}
                disabled={categories.length === 0}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search subcategories…"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="pl-9 h-8 text-sm border-slate-200"
              />
              {subSearch && (
                <button onClick={() => setSubSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">

              {/* "Add new subcategory" inline row */}
              {addingSub && (
                <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Parent category <span className="text-red-400">*</span>
                  </p>
                  {/* Category picker for the new sub */}
                  <AddSubCategoryRow
                    categories={categories}
                    defaultCategoryId={selectedCatId ?? ''}
                    onSave={async (title, catId) => {
                      const ok = await addSubCategory(title, catId);
                      if (ok) setAddingSub(false);
                      return ok;
                    }}
                    onCancel={() => setAddingSub(false)}
                  />
                </div>
              )}

              {filteredSubCategories.length === 0 && !addingSub && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Layers className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    {subSearch
                      ? 'No subcategories match your search'
                      : selectedCategory
                      ? `No subcategories under "${selectedCategory.title}"`
                      : 'No subcategories yet'}
                  </p>
                  {!subSearch && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingSub(true)}
                      disabled={categories.length === 0}
                      className="mt-3 text-xs gap-1"
                    >
                      <Plus className="w-3 h-3" /> Create first subcategory
                    </Button>
                  )}
                </div>
              )}

              {filteredSubCategories.map((sub, idx) => {
                const parentCat = categories.find((c) => c.id === sub.category_id);
                const isEditing = editingSubId === sub.id;
                const isMoving = movingSubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={cn(
                      'group px-4 py-3 flex items-center gap-3 transition-colors duration-150 animate-fade-in-up',
                      isEditing || isMoving ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    {isEditing ? (
                      <div className="flex-1">
                        <EditSubCategoryRow
                          sub={sub}
                          categories={categories}
                          onSave={async (title, catId) => updateSubCategory(sub.id, title, catId)}
                          onCancel={() => setEditingSubId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{sub.name}</p>
                          {!selectedCatId && parentCat && (
                            <p className="text-xs text-slate-400 truncate">{parentCat.title}</p>
                          )}
                        </div>

                        {!selectedCatId && parentCat && (
                          <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 hidden sm:flex flex-shrink-0">
                            {parentCat.title}
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingSubId(sub.id); setAddingSub(false); }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-sm">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <AlertDialogTitle>Delete "{sub.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the subcategory. Products assigned to it will become uncategorised. This cannot be undone.
                                  </AlertDialogDescription>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                <AlertDialogCancel className="border-slate-200 h-8 text-xs">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSubCategory(sub.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Add subcategory row (with category picker) ─────────────────────────────
function AddSubCategoryRow({
  categories,
  defaultCategoryId,
  onSave,
  onCancel,
}: {
  categories: { id: string; title: string }[];
  defaultCategoryId: string;
  onSave: (title: string, category_id: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !catId) return;
    setSaving(true);
    const ok = await onSave(title.trim(), catId);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="space-y-2 animate-fade-in-up">
      <Select value={catId} onValueChange={setCatId}>
        <SelectTrigger className="h-8 text-sm border-slate-200">
          <SelectValue placeholder="Select parent category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subcategory name…"
          className="h-8 text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-400/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button
          onClick={save}
          disabled={saving || !title.trim() || !catId}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onCancel}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Edit subcategory row (name + parent category) ──────────────────────────
function EditSubCategoryRow({
  sub,
  categories,
  onSave,
  onCancel,
}: {
  sub: { id: string; name: string; category_id: string };
  categories: { id: string; title: string }[];
  onSave: (title: string, category_id: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(sub.name);
  const [catId, setCatId] = useState(sub.category_id);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !catId) return;
    setSaving(true);
    const ok = await onSave(title.trim(), catId);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className="space-y-2 animate-fade-in-up">
      <Select value={catId} onValueChange={setCatId}>
        <SelectTrigger className="h-8 text-sm border-slate-200">
          <SelectValue placeholder="Parent category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subcategory name…"
          className="h-8 text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-400/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onCancel}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
