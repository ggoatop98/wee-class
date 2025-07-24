
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { PageHeader } from '../PageHeader';
import { Printer } from 'lucide-react';

interface CaseConceptualizationFormProps {
    studentName: string;
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
}

export default function CaseConceptualizationForm({ studentName, initialContent, onSave, onCancel }: CaseConceptualizationFormProps) {
    const [content, setContent] = useState(initialContent);

    const handleSaveClick = () => {
        onSave(content);
    };
    
    const handlePrint = () => {
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 30px; margin: 0 auto; max-width: 800px;">
                <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">사례개념화</h1>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; width: 120px;">내담자명</td>
                            <td style="border: 1px solid #ccc; padding: 8px;">${studentName}</td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">사례개념화 내용</h2>
                    <div style="min-height: 400px; padding: 10px; border: 1px solid #eee; word-wrap: break-word;">${content}</div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>사례개념화 인쇄</title>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        } else {
            alert('팝업 차단으로 인해 인쇄 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
        }
    }


    return (
        <div className="flex flex-col h-screen p-8">
             <PageHeader title={`${studentName} 사례개념화 ${initialContent ? '수정' : '작성'}`}>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄
                    </Button>
                    <Button variant="outline" onClick={onCancel}>취소</Button>
                    <Button onClick={handleSaveClick}>저장</Button>
                </div>
            </PageHeader>
            <div className="flex-grow pt-0">
                <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="사례개념화 내용을 입력하세요..."
                />
            </div>
        </div>
    );
}
