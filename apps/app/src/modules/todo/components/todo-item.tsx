import { useAtomSet } from '@effect/atom-react';
import type { Todo } from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Field, FieldLabel } from '@workspace/ui/components/field';
import { toast } from '@workspace/ui/components/toast';
import { cn } from '@workspace/ui/lib/utils';
import { Exit } from 'effect';
import { Trash2 } from 'lucide-react';
import { startTransition } from 'react';

import { isOptimisticId } from '@/lib/optimistic';
import { messageForCause } from '@/lib/rpc-error';

import { deleteTodoAtom, toggleTodoAtom } from '../atoms';

export function TodoItem({ todo }: { readonly todo: Todo }) {
  const toggleTodo = useAtomSet(toggleTodoAtom, { mode: 'promiseExit' });
  const deleteTodo = useAtomSet(deleteTodoAtom, { mode: 'promiseExit' });

  // Toggle/delete apply optimistically and instantly, so controls stay
  // responsive. The only locked state is an unsaved optimistic row: it has no
  // real id yet, so acting on it would hit the server with a non-existent id.
  const disabled = isOptimisticId(todo.id);

  const onToggle = () => {
    startTransition(async () => {
      const exit = await toggleTodo({ payload: { todoId: todo.id } });
      if (Exit.isFailure(exit)) toast.error(messageForCause(exit.cause));
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const exit = await deleteTodo({ payload: { todoId: todo.id } });
      if (Exit.isFailure(exit)) toast.error(messageForCause(exit.cause));
    });
  };

  return (
    <li className={cn('rounded-lg border border-border px-3 py-2', disabled && 'opacity-60')}>
      <Field orientation='horizontal'>
        <Checkbox
          id={todo.id}
          aria-label='Toggle todo'
          checked={todo.completed}
          disabled={disabled}
          onCheckedChange={onToggle}
        />
        <FieldLabel
          htmlFor={todo.id}
          className={cn(todo.completed && 'text-muted-foreground line-through')}
        >
          {todo.title}
        </FieldLabel>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Delete todo'
          disabled={disabled}
          onClick={onDelete}
          className='text-muted-foreground hover:text-destructive'
        >
          <Trash2 />
        </Button>
      </Field>
    </li>
  );
}
