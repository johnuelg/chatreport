import { useState, useEffect, useMemo, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface SpreadsheetPreviewContentProps {
  url: string;
  fileName: string;
  fileType: string;
  onDownload: () => void;
}

type SortDirection = "asc" | "desc" | null;

const PAGE_SIZE = 10;
const MAX_ROWS = 1000;

export function SpreadsheetPreviewContent({
  url,
  fileName,
  fileType,
  onDownload,
}: SpreadsheetPreviewContentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isCSV = fileType === "text/csv" || fileName.toLowerCase().endsWith(".csv");
  const isExcel =
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    fileName.toLowerCase().endsWith(".xlsx") ||
    fileName.toLowerCase().endsWith(".xls");

  // Parse spreadsheet data
  useEffect(() => {
    const parseData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        const blob = await response.blob();

        if (isCSV) {
          const text = await blob.text();
          Papa.parse(text, {
            complete: (result) => {
              const rows = result.data as string[][];
              if (rows.length > 0) {
                setHeaders(rows[0]);
                setData(rows.slice(1, MAX_ROWS + 1));
              }
              setLoading(false);
            },
            error: (err) => {
              setError(`Failed to parse CSV: ${err.message}`);
              setLoading(false);
            },
          });
        } else if (isExcel) {
          const arrayBuffer = await blob.arrayBuffer();
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          setWorkbook(wb);
          setSheets(wb.SheetNames);
          
          if (wb.SheetNames.length > 0) {
            setActiveSheet(wb.SheetNames[0]);
            loadSheet(wb, wb.SheetNames[0]);
          }
          setLoading(false);
        } else {
          setError("Unsupported file format");
          setLoading(false);
        }
      } catch (err) {
        setError(`Failed to load file: ${err instanceof Error ? err.message : "Unknown error"}`);
        setLoading(false);
      }
    };

    parseData();
  }, [url, isCSV, isExcel]);

  const loadSheet = useCallback((wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    if (jsonData.length > 0) {
      setHeaders((jsonData[0] as string[]).map(h => String(h ?? "")));
      setData(jsonData.slice(1, MAX_ROWS + 1).map(row => 
        (row as string[]).map(cell => String(cell ?? ""))
      ));
    } else {
      setHeaders([]);
      setData([]);
    }
    setCurrentPage(1);
    setSortColumn(null);
    setSortDirection(null);
  }, []);

  const handleSheetChange = useCallback((sheetName: string) => {
    if (workbook) {
      setActiveSheet(sheetName);
      loadSheet(workbook, sheetName);
    }
  }, [workbook, loadSheet]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortColumn !== null && sortDirection) {
      result.sort((a, b) => {
        const aVal = String(a[sortColumn] ?? "");
        const bVal = String(b[sortColumn] ?? "");
        
        // Try numeric sort
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }
        
        // Fall back to string sort
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / PAGE_SIZE);

  // Keep the current page in range when filters/page size change
  useEffect(() => {
    if (totalPages <= 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, processedData.length);
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage]);


  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (columnIndex: number) => {
    if (sortColumn !== columnIndex) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    }
    return <ArrowDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
        {/* Sheet tabs for Excel */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-1 mr-4">
            {sheets.map((sheet) => (
              <Button
                key={sheet}
                variant={activeSheet === sheet ? "default" : "outline"}
                size="sm"
                onClick={() => handleSheetChange(sheet)}
                className="text-xs"
              >
                {sheet}
              </Button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8"
          />
        </div>

        {/* Row count */}
        <div className="text-sm text-muted-foreground">
          {searchQuery
            ? `Showing ${processedData.length} of ${data.length} rows`
            : `${data.length} rows`}
          {data.length >= MAX_ROWS && (
            <span className="text-warning ml-1">(limited to first {MAX_ROWS})</span>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1 min-h-0">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map((header, index) => (
                <TableHead
                  key={index}
                  className="h-10 px-3 cursor-pointer hover:bg-muted/80 transition-colors whitespace-nowrap"
                  onClick={() => handleSort(index)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[200px]">{header || `Column ${index + 1}`}</span>
                    {getSortIcon(index)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchQuery ? "No matching rows found" : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={(currentPage - 1) * PAGE_SIZE + rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-3 py-2 max-w-[300px]">
                      <span className="truncate block">{row[cellIndex] ?? ""}</span>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination - Sticky footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-background shrink-0 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        {/* Row count display */}
        <div className="text-sm text-muted-foreground">
          Rows {processedData.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
          {Math.min(currentPage * PAGE_SIZE, processedData.length)} of{" "}
          {processedData.length}
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">Page {currentPage}</span>
            <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
