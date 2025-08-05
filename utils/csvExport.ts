import { Item } from '@/types';
import { Platform } from 'react-native';

export type ExportMode = 'all' | 'belowMin' | 'belowMax' | 'overstock';

export function filterItemsForExport(items: Item[], mode: ExportMode): Item[] {
  switch (mode) {
    case 'all':
      return items;
    case 'belowMin':
      return items.filter(item => item.min !== undefined && item.qty < item.min);
    case 'belowMax':
      return items.filter(item => item.max !== undefined && item.qty < item.max);
    case 'overstock':
      return items.filter(item => item.max !== undefined && item.qty > item.max);
    default:
      return items;
  }
}

export function convertItemsToCSV(items: Item[]): string {
  if (items.length === 0) {
    return 'Internal,Custom,UPC,Quantity,Min,Max,Bin\n';
  }

  const headers = ['Internal', 'Custom', 'UPC', 'Quantity', 'Min', 'Max', 'Bin'];
  const csvContent = [headers.join(',')];

  items.forEach(item => {
    const row = [
      escapeCSVField(item.internal || ''),
      escapeCSVField(item.custom || ''),
      escapeCSVField(item.upc || ''),
      item.qty.toString(),
      item.min?.toString() || '',
      item.max?.toString() || '',
      escapeCSVField(item.bin || '')
    ];
    csvContent.push(row.join(','));
  });

  return csvContent.join('\n');
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function downloadCSV(csvContent: string, filename: string): void {
  if (Platform.OS === 'web') {
    // Web implementation
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Mobile implementation - we'll use sharing
    console.log('CSV content ready for sharing:', csvContent.substring(0, 100) + '...');
    // Note: For mobile, we would typically use expo-sharing or expo-file-system
    // but since we need web compatibility, we'll show an alert with instructions
  }
}

export function getExportFilename(mode: ExportMode, warehouseName: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const modeText = {
    all: 'all-items',
    belowMin: 'below-min',
    belowMax: 'below-max',
    overstock: 'overstock'
  }[mode];
  
  return `${warehouseName.replace(/[^a-zA-Z0-9]/g, '-')}-${modeText}-${timestamp}.csv`;
}