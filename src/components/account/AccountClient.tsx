
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: z.string().min(6, '새 비밀번호는 6자리 이상이어야 합니다.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

const deleteSchema = z.object({
  passwordForDelete: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export default function AccountClient() {
  const { user, updateCurrentUserPassword, deleteCurrentUserAccount } = useAuth();
  const { toast } = useToast();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const deleteForm = useForm<z.infer<typeof deleteSchema>>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      passwordForDelete: '',
    }
  });

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsPasswordLoading(true);
    try {
      await updateCurrentUserPassword(values.currentPassword, values.newPassword);
      toast({
        title: '성공',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error(error);
      let description = '비밀번호 변경 중 오류가 발생했습니다.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = '현재 비밀번호가 올바르지 않습니다.';
      }
      toast({
        variant: 'destructive',
        title: '오류',
        description,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteTrigger = () => {
    // We only open the dialog here. The actual deletion is handled by onConfirmDelete.
    setIsDeleteAlertOpen(true);
  };
  
  const onConfirmDelete = async (values: z.infer<typeof deleteSchema>) => {
    setIsDeleteAlertOpen(false); // Close the dialog first
    setIsDeleteLoading(true);
    try {
        await deleteCurrentUserAccount(values.passwordForDelete);
        // No success toast here, as the user will be redirected by the AuthContext
    } catch (error: any) {
        console.error(error);
        let description = '계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = '비밀번호가 올바르지 않습니다.';
        }
        toast({
            variant: 'destructive',
            title: '오류',
            description,
        });
    } finally {
        setIsDeleteLoading(false);
        deleteForm.reset();
    }
  };


  return (
    <>
      <PageHeader title="계정 관리" />
      <div className="grid gap-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>새로운 비밀번호를 설정합니다. 현재 비밀번호가 필요합니다.</CardDescription>
          </CardHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>현재 비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>새 비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>새 비밀번호 확인</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  비밀번호 변경
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">회원 탈퇴</CardTitle>
            <CardDescription>이 작업은 되돌릴 수 없습니다. 계정과 모든 관련 데이터가 영구적으로 삭제됩니다.</CardDescription>
          </CardHeader>
          <CardFooter>
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} disabled={isDeleteLoading}>
                        {isDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        회원 탈퇴
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <Form {...deleteForm}>
                        <form onSubmit={deleteForm.handleSubmit(onConfirmDelete)}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    계속하려면 비밀번호를 입력하세요. 이 작업은 되돌릴 수 없으며 모든 데이터가 영구적으로 삭제됩니다.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <FormField
                                    control={deleteForm.control}
                                    name="passwordForDelete"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>비밀번호 확인</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} autoFocus />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel type="button" onClick={() => { deleteForm.reset(); setIsDeleteAlertOpen(false); }}>취소</AlertDialogCancel>
                                <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">
                                    {isDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    탈퇴 확인
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
