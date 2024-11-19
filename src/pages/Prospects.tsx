import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridApi, 
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../styles/ag-grid-custom.css';
import { Prospect, ServiceType } from '../types/calendar';
import { format } from 'date-fns';
import { fetchProspects } from '../lib/api';
import { Search } from 'lucide-react';

export default function Prospects() {
  const [rowData, setRowData] = React.useState<Prospect[]>([]);
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null);
  const [quickFilterText, setQuickFilterText] = React.useState('');

  React.useEffect(() => {
    const loadProspects = async () => {
      try {
        const prospects = await fetchProspects();
        setRowData(prospects);
      } catch (error) {
        console.error('Error loading prospects:', error);
      }
    };

    loadProspects();
  }, []);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    
    // Auto-size all columns if columnApi is available
    if (params.columnApi) {
      const allColumnIds: string[] = [];
      params.columnApi.getColumns()?.forEach((column) => {
        allColumnIds.push(column.getId());
      });
      if (allColumnIds.length > 0) {
        params.columnApi.autoSizeColumns(allColumnIds);
      }
    }
  };

  const onFilterTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuickFilterText(text);
    if (gridApi) {
      gridApi.setQuickFilter(text);
    }
  };

  const columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: 'location',
      headerName: 'Location',
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: 'services',
      headerName: 'Services',
      sortable: true,
      filter: true,
      flex: 1,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return params.value.map((service: { type: ServiceType }) => {
          switch (service.type) {
            case 'couch':
              return 'Couch Cleaning';
            case 'carpet':
              return 'Carpet Cleaning';
            case 'auto-detailing':
              return 'Auto Detailing';
            case 'mattress':
              return 'Mattress Cleaning';
            default:
              return service.type;
          }
        }).join(', ');
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800',
          confirmed: 'bg-green-100 text-green-800',
          completed: 'bg-blue-100 text-blue-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        const status = params.value as keyof typeof statusColors;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      sortable: true,
      filter: true,
      width: 150,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        return format(new Date(params.value), 'MMM d, yyyy');
      },
    },
    {
      field: 'time',
      headerName: 'Time',
      sortable: true,
      filter: true,
      width: 100,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      field: 'reminders',
      headerName: 'Reminders',
      sortable: true,
      filter: true,
      width: 120,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '0';
        return params.value.length.toString();
      },
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search prospects..."
              value={quickFilterText}
              onChange={onFilterTextChange}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 ag-theme-alpine p-6">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          suppressRowClickSelection={true}
          pagination={true}
          paginationPageSize={20}
          onGridReady={onGridReady}
          rowHeight={48}
          headerHeight={48}
          enableColumnHover={true}
          suppressMenuHide={true}
          suppressFloatingFilter={true}
        />
      </div>
    </div>
  );
}
