
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, listAll, uploadString, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function SecurityTest() {
  const { user } = useAuth();

  const handleTestRead = async () => {
    console.log('%c--- 보안 규칙 테스트 (읽기) 시작 ---', 'color: blue; font-weight: bold;');
    if (!user) {
      console.warn("테스트 실패: 사용자가 로그인하지 않았습니다.");
      return;
    }
    
    // 현재 사용자가 아닌, 임의의 가짜 사용자 ID를 사용합니다.
    const fakeUserId = 'fake-user-id-12345';
    const fakeStudentId = 'fake-student-id-67890';
    const illegalRef = ref(storage, `student_files/${fakeUserId}/${fakeStudentId}/`);

    console.log(`시도: 현재 사용자(${user.uid})가 다른 사용자(${fakeUserId})의 파일 목록을 읽으려고 합니다.`);
    console.log(`경로: ${illegalRef.fullPath}`);

    try {
      await listAll(illegalRef);
      // 이 코드가 실행되면 보안 규칙이 작동하지 않는 것입니다.
      console.error('%c테스트 실패: 다른 사용자의 파일 목록을 읽는 데 성공했습니다. 보안 규칙을 확인하세요!', 'color: red; font-weight: bold;');
    } catch (error: any) {
      if (error.code === 'storage/unauthorized') {
        // 이것이 기대하는 성공적인 결과입니다.
        console.log('%c테스트 성공: 접근이 거부되었습니다. 보안 규칙이 올바르게 작동하고 있습니다.', 'color: green; font-weight: bold;');
      } else {
        console.error('예상치 못한 오류 발생:', error);
      }
    }
    console.log('%c--- 보안 규칙 테스트 (읽기) 종료 ---', 'color: blue; font-weight: bold;');
  };

  const handleTestWrite = async () => {
    console.log('%c--- 보안 규칙 테스트 (쓰기) 시작 ---', 'color: blue; font-weight: bold;');
    if (!user) {
      console.warn("테스트 실패: 사용자가 로그인하지 않았습니다.");
      return;
    }

    const fakeUserId = 'fake-user-id-12345';
    const fakeStudentId = 'fake-student-id-67890';
    const illegalFileRef = ref(storage, `student_files/${fakeUserId}/${fakeStudentId}/illegal-test-file.txt`);

    console.log(`시도: 현재 사용자(${user.uid})가 다른 사용자(${fakeUserId})의 경로에 파일을 업로드하려고 합니다.`);
    console.log(`경로: ${illegalFileRef.fullPath}`);

    try {
      await uploadString(illegalFileRef, "This should not be uploaded.", 'raw');
      // 이 코드가 실행되면 보안 규칙이 작동하지 않는 것입니다.
      console.error('%c테스트 실패: 다른 사용자의 경로에 파일을 쓰는 데 성공했습니다. 보안 규칙을 확인하세요!', 'color: red; font-weight: bold;');
    } catch (error: any) {
      if (error.code === 'storage/unauthorized') {
        // 이것이 기대하는 성공적인 결과입니다.
        console.log('%c테스트 성공: 접근이 거부되었습니다. 보안 규칙이 올바르게 작동하고 있습니다.', 'color: green; font-weight: bold;');
      } else {
        console.error('예상치 못한 오류 발생:', error);
      }
    }
     console.log('%c--- 보안 규칙 테스트 (쓰기) 종료 ---', 'color: blue; font-weight: bold;');
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <CardTitle>임시 보안 테스트</CardTitle>
        </div>
        <CardDescription>
          아래 버튼을 클릭하고 브라우저 개발자 콘솔(F12)을 확인하세요. 각 테스트에서 'permission-denied' 또는 'unauthorized' 오류가 발생하면 보안 규칙이 성공적으로 작동하는 것입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button onClick={handleTestRead} variant="outline">
          다른 사용자 파일 읽기 시도
        </Button>
        <Button onClick={handleTestWrite} variant="outline">
          다른 사용자 파일 쓰기 시도
        </Button>
      </CardContent>
    </Card>
  );
}
