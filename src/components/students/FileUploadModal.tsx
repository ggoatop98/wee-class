
"use client";

import React, { useState, useRef } from 'react';
import type { Student } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, UploadCloud } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student;
  onUpload: (file: File) => void;
}

export default function FileUploadModal({ isOpen, onOpenChange, student, onUpload }: FileUploadModalProps) {
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
    setSelectedFile(null); // Reset after upload
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student.name} 학생 파일 업로드</DialogTitle>
          <DialogDescription>
            업로드할 파일을 선택한 후 저장 버튼을 눌러주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
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
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            취소
          </Button>
          <Button onClick={handleUploadClick} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
