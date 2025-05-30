
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Upload, FileUp, User } from 'lucide-react';

interface ListItem {
  firstName: string;
  phone: string;
  notes: string;
}

interface DistributedList {
  id: string;
  fileName: string;
  uploadDate: string;
  totalItems: number;
  agentDistribution: {
    agentName: string;
    items: ListItem[];
  }[];
}

const ListDistribution = () => {
  const [distributedLists, setDistributedLists] = useState<DistributedList[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agents = [
    'John Doe',
    'Jane Smith',
    'Mike Johnson',
    'Sarah Wilson',
    'David Brown'
  ];

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
  };

  const parseCSV = (content: string): ListItem[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['firstname', 'phone', 'notes'];
    const hasValidHeaders = requiredHeaders.every(header => 
      headers.some(h => h.includes(header))
    );
    
    if (!hasValidHeaders) {
      throw new Error('CSV must contain FirstName, Phone, and Notes columns');
    }
    
    const data: ListItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 3) {
        data.push({
          firstName: values[0] || '',
          phone: values[1] || '',
          notes: values[2] || ''
        });
      }
    }
    
    return data;
  };

  const distributeItems = (items: ListItem[]) => {
    const agentCount = agents.length;
    const itemsPerAgent = Math.floor(items.length / agentCount);
    const remainingItems = items.length % agentCount;
    
    const distribution = agents.map((agentName, index) => {
      const startIndex = index * itemsPerAgent;
      const endIndex = startIndex + itemsPerAgent + (index < remainingItems ? 1 : 0);
      
      return {
        agentName,
        items: items.slice(startIndex, endIndex)
      };
    });
    
    return distribution;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV, XLSX, or XLS file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const content = await file.text();
      const items = parseCSV(content);
      
      if (items.length === 0) {
        throw new Error('No valid data found in the file');
      }

      const distribution = distributeItems(items);
      
      const newDistributedList: DistributedList = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString(),
        totalItems: items.length,
        agentDistribution: distribution
      };

      setDistributedLists([newDistributedList, ...distributedLists]);
      
      toast({
        title: "File Uploaded Successfully",
        description: `${items.length} items distributed among ${agents.length} agents.`,
      });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process the file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">List Distribution</h1>
          <p className="text-gray-600 mt-2">Upload and distribute CSV files among agents</p>
        </div>
        
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV/Excel
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
          <CardDescription>
            Please ensure your CSV/Excel file has the following columns:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">FirstName</h3>
              <p className="text-sm text-blue-700">Contact's first name</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">Phone</h3>
              <p className="text-sm text-green-700">Phone number</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900">Notes</h3>
              <p className="text-sm text-purple-700">Additional notes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {distributedLists.length > 0 && (
        <div className="space-y-4">
          {distributedLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileUp className="w-5 h-5 mr-2" />
                    {list.fileName}
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    {list.uploadDate}
                  </span>
                </CardTitle>
                <CardDescription>
                  {list.totalItems} items distributed among {list.agentDistribution.length} agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.agentDistribution.map((agent, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {agent.agentName}
                        </CardTitle>
                        <CardDescription>
                          {agent.items.length} items assigned
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {agent.items.slice(0, 3).map((item, itemIndex) => (
                            <div key={itemIndex} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{item.firstName}</div>
                              <div className="text-gray-600">{item.phone}</div>
                            </div>
                          ))}
                          {agent.items.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{agent.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListDistribution;
