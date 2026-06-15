import { useAtomSet } from '@effect/atom-react';
import { Button } from '@workspace/ui/components/button';
import { Field, FieldDescription, FieldLabel } from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { toast } from '@workspace/ui/components/toast';
import { Exit } from 'effect';
import { startTransition } from 'react';

import { messageForCause } from '@/lib/rpc-error';

import { createTodoAtom } from '../atoms';

export function TodoForm() {
  const createTodo = useAtomSet(createTodoAtom, { mode: 'promiseExit' });

  const addTodo = (formData: FormData) => {
    const value = formData.get('title');
    const title = typeof value === 'string' ? value.trim() : '';
    if (title.length === 0) return;
    // Optimistic: the new todo shows instantly and the form resets for the next
    // entry, so the form needs no pending state — only the failure toast.
    startTransition(async () => {
      const exit = await createTodo({ payload: { title } });
      if (Exit.isFailure(exit)) toast.error(messageForCause(exit.cause));
    });
  };

  return (
    <form action={addTodo}>
      <Field>
        <FieldLabel htmlFor='new-todo'>New todo</FieldLabel>
        <div className='flex gap-2'>
          <Input
            id='new-todo'
            name='title'
            required
            placeholder='What needs doing?'
            className='flex-1'
          />
          <Button type='submit'>Add</Button>
        </div>
        <FieldDescription>Add something you need to get done.</FieldDescription>
      </Field>
    </form>
  );
}
