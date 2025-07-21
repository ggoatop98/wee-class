
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>{studentName} 사례개념화 {initialContent ? '수정' : '작성'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="conceptualization-content">내용</Label>
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="사례개념화 내용을 입력하세요..."
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>취소</Button>
                <Button onClick={handleSaveClick}>저장</Button>
            </CardFooter>
        </Card>
    );
}
