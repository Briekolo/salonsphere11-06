'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, GripVertical, Save, X, AlertCircle } from 'lucide-react'
import {
  useTreatmentCategories,
  useCreateTreatmentCategory,
  useUpdateTreatmentCategory,
  useDeleteTreatmentCategory,
  useReorderTreatmentCategories,
  type TreatmentCategory,
} from '@/lib/hooks/useTreatmentCategories'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRESET_COLORS = [
  { bg: 'bg-pink-100', text: 'text-pink-800', value: 'pink' },
  { bg: 'bg-purple-100', text: 'text-purple-800', value: 'purple' },
  { bg: 'bg-blue-100', text: 'text-blue-800', value: 'blue' },
  { bg: 'bg-green-100', text: 'text-green-800', value: 'green' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', value: 'yellow' },
  { bg: 'bg-red-100', text: 'text-red-800', value: 'red' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', value: 'indigo' },
  { bg: 'bg-teal-100', text: 'text-teal-800', value: 'teal' },
]


interface SortableItemProps {
  category: TreatmentCategory
  onEdit: (category: TreatmentCategory) => void
  onDelete: (id: string) => void
}

function SortableItem({ category, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-white border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        PRESET_COLORS.find(c => c.value === category.color)?.bg || 'bg-gray-100'
      } ${
        PRESET_COLORS.find(c => c.value === category.color)?.text || 'text-gray-800'
      }`}>
        {category.name}
      </div>

      <div className="flex-1">
        {category.description && (
          <p className="text-sm text-gray-600">{category.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${
          category.active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {category.active ? 'Actief' : 'Inactief'}
        </span>

        <button
          onClick={() => onEdit(category)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>

        <button
          onClick={() => onDelete(category.id)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  )
}

interface CategoryFormProps {
  category?: TreatmentCategory | null
  onSave: (data: any) => void
  onCancel: () => void
}

function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || PRESET_COLORS[0].value,
    active: category?.active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {category ? 'Categorie bewerken' : 'Nieuwe categorie'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Naam *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Bijv. Nagelverzorging"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beschrijving
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={2}
          placeholder="Optionele beschrijving..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kleur
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: colorOption.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                formData.color === colorOption.value 
                  ? 'border-gray-900 ' + colorOption.bg + ' ' + colorOption.text
                  : 'border-gray-200 ' + colorOption.bg + ' ' + colorOption.text + ' hover:border-gray-300'
              }`}
            >
              {colorOption.value.charAt(0).toUpperCase() + colorOption.value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Categorie is actief
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outlined"
        >
          Annuleren
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Opslaan
        </button>
      </div>
    </form>
  )
}

export function CategoryManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TreatmentCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useTreatmentCategories()
  const createMutation = useCreateTreatmentCategory()
  const updateMutation = useUpdateTreatmentCategory()
  const deleteMutation = useDeleteTreatmentCategory()
  const reorderMutation = useReorderTreatmentCategories()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      const newOrder = arrayMove(categories, oldIndex, newIndex)
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        display_order: index,
      }))

      reorderMutation.mutate(updates)
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          updates: data,
        })
      } else {
        await createMutation.mutateAsync({
          ...data,
          display_order: categories.length,
        })
      }
      setShowForm(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category: TreatmentCategory) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await deleteMutation.mutateAsync(id)
        setDeleteConfirm(null)
      } catch (error: any) {
        alert(error.message || 'Verwijderen mislukt')
      }
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg" />
        <div className="animate-pulse h-12 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categorieën beheren</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sleep categorieën om de volgorde aan te passen
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowForm(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe categorie
          </button>
        )}
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingCategory(null)
          }}
        />
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nog geen categorieën aangemaakt</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id}>
                  <SortableItem
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  {deleteConfirm === category.id && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        Klik nogmaals om te bevestigen
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}