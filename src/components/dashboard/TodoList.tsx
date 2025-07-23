
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import type { Todo } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo));
      setTodos(todosData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'todos'), {
        userId: user.uid,
        task: newTask.trim(),
        isCompleted: false,
        createdAt: Timestamp.now(),
      });
      setNewTask('');
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  const handleToggleTodo = async (id: string, isCompleted: boolean) => {
    const todoRef = doc(db, 'todos', id);
    try {
      await updateDoc(todoRef, { isCompleted: !isCompleted });
    } catch (error) {
      console.error("Error updating task: ", error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const todoRef = doc(db, 'todos', id);
    try {
      await deleteDoc(todoRef);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do 리스트</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="새로운 할 일을 입력하세요."
          />
          <Button type="submit" size="icon">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </form>
        <ScrollArea className="h-[240px]">
          <div className="space-y-4">
            {todos.length > 0 ? (
              todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-2">
                  <Checkbox
                    id={todo.id}
                    checked={todo.isCompleted}
                    onCheckedChange={() => handleToggleTodo(todo.id, todo.isCompleted)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={todo.id}
                    className={`flex-grow text-sm ${todo.isCompleted ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {todo.task}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground pt-10">
                할 일이 없습니다.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
