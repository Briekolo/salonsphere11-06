'use client';

import { useState, useRef } from 'react';
import { useRequireAdmin } from '@/lib/hooks/use-admin';
import { useTenant } from '@/lib/hooks/useTenant';
import { 
  Database, 
  Download, 
  Upload, 
  FileText, 
  Calendar,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  X,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  Table
} from 'lucide-react';

interface ImportFile {
  file: File;
  type: string;
  status: 'pending' | 'validating' | 'ready' | 'error' | 'importing' | 'completed';
  rows?: number;
  errors?: string[];
  preview?: any[];
}

export default function DataManagementPage() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const { tenantId } = useTenant();
  const [exportLoading, setExportLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState('2024-06-15 14:30');
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async (dataType: string) => {
    setExportLoading(true);
    
    // Simulate export process
    setTimeout(() => {
      const filename = `salonsphere_${dataType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Create sample CSV content based on data type
      let csvContent = '';
      switch (dataType) {
        case 'clients':
          csvContent = 'ID,Naam,Email,Telefoon,Adres,Laatste Bezoek\n1,Sophie de Vries,sophie@email.com,06-12345678,Hoofdstraat 123,2024-06-10\n2,Marie Janssen,marie@email.com,06-87654321,Kerkstraat 45,2024-06-12';
          break;
        case 'appointments':
          csvContent = 'ID,Klant,Behandeling,Datum,Tijd,Status,Prijs\n1,Sophie de Vries,Knipbeurt,2024-06-10,14:00,Voltooid,€45.00\n2,Marie Janssen,Kleuring,2024-06-12,10:30,Voltooid,€85.00';
          break;
        case 'treatments':
          csvContent = 'ID,Naam,Categorie,Duur,Prijs,Actief\n1,Knipbeurt,Haar,45,€45.00,Ja\n2,Kleuring,Haar,120,€85.00,Ja';
          break;
        case 'inventory':
          csvContent = 'ID,Product,Categorie,Voorraad,Prijs,Leverancier\n1,Shampoo L\'Oréal,Haarverzorging,25,€12.50,L\'Oréal\n2,Conditioner,Haarverzorging,18,€15.00,Wella';
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportLoading(false);
    }, 2000);
  };

  const handleCreateBackup = async () => {
    // Simulate backup creation
    setLastBackup(new Date().toLocaleString('nl-NL'));
    alert('Backup succesvol aangemaakt!');
  };

  const detectFileType = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('klant') || lowerName.includes('client')) return 'clients';
    if (lowerName.includes('afspraak') || lowerName.includes('appointment')) return 'appointments';
    if (lowerName.includes('behandeling') || lowerName.includes('treatment') || lowerName.includes('service')) return 'treatments';
    if (lowerName.includes('voorraad') || lowerName.includes('inventory') || lowerName.includes('product')) return 'inventory';
    return 'unknown';
  };

  const handleFiles = (files: FileList) => {
    const newFiles: ImportFile[] = Array.from(files).map(file => ({
      file,
      type: detectFileType(file.name),
      status: 'pending' as const
    }));

    setImportFiles(prev => [...prev, ...newFiles]);

    // Simulate file validation
    newFiles.forEach((file, index) => {
      setTimeout(() => {
        validateFile(prev => prev.length - newFiles.length + index);
      }, 1000 + index * 500);
    });
  };

  const validateFile = (fileIndex: number) => {
    setImportFiles(prev => {
      const updated = [...prev];
      const file = updated[fileIndex];
      if (!file) return prev;

      file.status = 'validating';
      
      // Simulate validation
      setTimeout(() => {
        setImportFiles(prev => {
          const updated = [...prev];
          const file = updated[fileIndex];
          if (!file) return prev;

          // Mock validation results
          const isValid = Math.random() > 0.2;
          if (isValid) {
            file.status = 'ready';
            file.rows = Math.floor(Math.random() * 1000) + 50;
            file.preview = [
              { naam: 'Sophie de Vries', email: 'sophie@email.com', telefoon: '06-12345678' },
              { naam: 'Lucas Jansen', email: 'lucas@email.com', telefoon: '06-87654321' },
              { naam: 'Emma de Wit', email: 'emma@email.com', telefoon: '06-11223344' }
            ];
          } else {
            file.status = 'error';
            file.errors = ['Ongeldig bestandsformaat', 'Verplichte kolommen ontbreken'];
          }
          return updated;
        });
      }, 2000);

      return updated;
    });
  };

  const handleImport = async (fileIndex: number) => {
    setImportFiles(prev => {
      const updated = [...prev];
      const file = updated[fileIndex];
      if (!file) return prev;
      file.status = 'importing';
      return updated;
    });

    // Simulate import process
    setTimeout(() => {
      setImportFiles(prev => {
        const updated = [...prev];
        const file = updated[fileIndex];
        if (!file) return prev;
        file.status = 'completed';
        return updated;
      });
    }, 3000);
  };

  const removeFile = (index: number) => {
    setImportFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  const dataTypes = [
    {
      name: 'Klanten Data',
      description: 'Alle klantgegevens en contactinformatie',
      icon: <Users className="w-5 h-5" />,
      type: 'clients',
      color: 'text-icon-blue',
      bgColor: 'bg-icon-blue-bg'
    },
    {
      name: 'Afspraken Data',
      description: 'Afsprakenhistorie en planning',
      icon: <Calendar className="w-5 h-5" />,
      type: 'appointments',
      color: 'text-icon-green',
      bgColor: 'bg-icon-green-bg'
    },
    {
      name: 'Behandelingen Data',
      description: 'Diensten, prijzen en categorieën',
      icon: <FileText className="w-5 h-5" />,
      type: 'treatments',
      color: 'text-icon-purple',
      bgColor: 'bg-icon-purple-bg'
    },
    {
      name: 'Voorraad Data',
      description: 'Producten en voorraadinformatie',
      icon: <Package className="w-5 h-5" />,
      type: 'inventory',
      color: 'text-icon-orange',
      bgColor: 'bg-icon-orange-bg'
    }
  ];

  return (
    <div className="mobile-p space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Beheer</h1>
        <p className="text-gray-600 mt-2">
          Backup, export en import uw salon data
        </p>
      </div>

      {/* Backup Status */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-5 w-5" />
          <h2 className="text-heading">Backup Status</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Laatste backup</p>
              <p className="text-sm text-green-700">{lastBackup}</p>
            </div>
          </div>
          <button
            onClick={handleCreateBackup}
            className="btn-outlined"
          >
            <Download className="h-4 w-4" />
            Nieuwe Backup
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5" />
          <h2 className="text-heading">Data Export</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {dataTypes.map((dataType) => (
            <div key={dataType.type} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${dataType.bgColor}`}>
                    <div className={dataType.color}>{dataType.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-medium">{dataType.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{dataType.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportData(dataType.type)}
                  disabled={exportLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {exportLoading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Import */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5" />
          <h2 className="text-heading">Data Import</h2>
        </div>
        
        {/* Drop Zone */}
        <div 
          className={`border-2 border-dashed ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'} rounded-xl p-8 text-center transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Data Import</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sleep bestanden hierheen of klik om te uploaden
          </p>
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outlined"
            >
              Bestanden Selecteren
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Ondersteunde formaten: CSV, Excel (.xlsx)
          </p>
        </div>

        {/* Import Files List */}
        {importFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {importFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{file.file.name}</p>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {file.type === 'unknown' ? 'Onbekend type' : file.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                      
                      {/* Status */}
                      {file.status === 'pending' && (
                        <p className="text-sm text-gray-500 mt-2">Wachten op validatie...</p>
                      )}
                      
                      {file.status === 'validating' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Bestand valideren...
                        </div>
                      )}
                      
                      {file.status === 'ready' && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Klaar voor import - {file.rows} rijen gevonden
                          </div>
                          
                          {/* Preview Table */}
                          {file.preview && (
                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-2">
                                <Table className="h-3 w-3" />
                                Voorbeeld (eerste 3 rijen)
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 text-xs">
                                    <tr>
                                      {Object.keys(file.preview[0]).map((key) => (
                                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 capitalize">
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 text-xs">
                                    {file.preview.map((row, i) => (
                                      <tr key={i}>
                                        {Object.values(row).map((value, j) => (
                                          <td key={j} className="px-3 py-2 text-gray-900">
                                            {value as string}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {file.status === 'error' && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Validatie mislukt
                          </div>
                          {file.errors && (
                            <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                              {file.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      {file.status === 'importing' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Data importeren...
                        </div>
                      )}
                      
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <Check className="h-4 w-4" />
                          Import voltooid
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'ready' && (
                      <button
                        onClick={() => handleImport(index)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Importeren
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                      disabled={file.status === 'importing'}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Let op bij data import</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Controleer altijd uw data voordat u importeert</li>
                <li>Maak eerst een backup van bestaande data</li>
                <li>Duplicaten worden automatisch gedetecteerd</li>
                <li>Import kan niet ongedaan gemaakt worden</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Data Compliance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h2 className="text-heading">Data Compliance</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">GDPR Compliance</p>
              <p className="text-sm text-gray-600">Automatische verwijdering van oude klantdata na 7 jaar</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Data Encryptie</p>
              <p className="text-sm text-gray-600">Alle gegevens worden veilig versleuteld opgeslagen</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="font-medium">Automatische Backups</p>
              <p className="text-sm text-gray-600">Dagelijkse automatische backups naar veilige cloud storage</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}