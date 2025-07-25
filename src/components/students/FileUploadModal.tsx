
"use client";

import React, { useState, useRef } from 'react';
import type { Student, UploadedFile } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, UploadCloud, Trash2, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FileUploadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student;
  onUpload: (file: File) => Promise<void>;
  onDelete: (file: UploadedFile) => Promise<void>;
  files: UploadedFile[];
  isFetchingFiles: boolean;
}

export default function FileUploadModal({ isOpen, onOpenChange, student, onUpload, onDelete, files, isFetchingFiles }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await onUpload(selectedFile);
    setIsUploading(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    onOpenChange(false);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student.name} 학생 파일 관리</DialogTitle>
          <DialogDescription>
            파일을 업로드하거나 기존 파일을 관리하세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Upload section */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">새 파일 업로드</h3>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button variant="outline" onClick={triggerFileSelect} disabled={isUploading} className="w-full">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    파일 선택
                </Button>
                
                {selectedFile && (
                    <div className="mt-4 p-3 border rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" title={selectedFile.name}>{selectedFile.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                        {formatFileSize(selectedFile.size)}
                    </span>
                    </div>
                )}
                <Button onClick={handleUploadClick} disabled={!selectedFile || isUploading} className="w-full">
                    {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        업로드 중...
                    </>
                    ) : (
                    '업로드'
                    )}
                </Button>
            </div>

            {/* File list section */}
            <div className="space-y-4 p-4 border rounded-lg">
                 <h3 className="font-semibold text-lg">업로드된 파일 목록</h3>
                 <ScrollArea className="h-64">
                    {isFetchingFiles ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground text-sm">업로드된 파일이 없습니다.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>파일명</TableHead>
                                    <TableHead className="text-right w-[80px]">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {files.map(file => (
                                    <TableRow key={file.id}>
                                        <TableCell className="font-medium truncate" title={file.fileName}>{file.fileName}</TableCell>
                                        <TableCell className="text-right">
                                            <a href={file.downloadURL} target="_blank" rel="noopener noreferrer">
                                              <Button variant="ghost" size="icon" title="다운로드">
                                                <Download className="h-4 w-4" />
                                              </Button>
                                            </a>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="삭제">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                    이 작업은 되돌릴 수 없습니다. 파일이 영구적으로 삭제됩니다.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(file)} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
                                                </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                 </ScrollArea>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
