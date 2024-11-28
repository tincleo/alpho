import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Prospect } from '../../types/calendar';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { useToast } from '../../hooks/use-toast';

interface Props {
  prospects: Prospect[];
}

const POSITION_INCREMENT = 1024;

const calculatePosition = (prevPos: number | null, nextPos: number | null): number => {
  if (!prevPos) return nextPos ? nextPos / 2 : POSITION_INCREMENT;
  if (!nextPos) return prevPos + POSITION_INCREMENT;
  return (prevPos + nextPos) / 2;
};

const getColumnProspects = (prospects: Prospect[], status: string) => {
  return prospects
    .filter(p => p.status === status)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
};

export default function ProspectKanban({ prospects }: Props) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localProspects, setLocalProspects] = React.useState<Prospect[]>(prospects);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Keep local state in sync with props
  React.useEffect(() => {
    setLocalProspects(prospects);
  }, [prospects]);

  const updateProspectMutation = useMutation({
    mutationFn: async ({ 
      cardId, 
      targetStatus, 
      newPosition 
    }: { 
      cardId: string; 
      targetStatus: string; 
      newPosition: number;
    }) => {
      const { error } = await supabase
        .from('prospects')
        .update({ 
          status: targetStatus,
          position: newPosition,
        })
        .eq('id', cardId);

      if (error) throw error;
    },
    onError: (err, variables, context) => {
      // Revert to previous state on error
      if (context?.previousProspects) {
        setLocalProspects(context.previousProspects);
        queryClient.setQueryData(['prospects'], context.previousProspects);
      }
      toast({
        title: "Error updating prospect",
        description: "There was an error updating the prospect. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      toast({
        title: "Prospect updated",
        description: "The prospect has been successfully updated.",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProspect = localProspects.find(p => p.id === activeId);
    const overProspect = localProspects.find(p => p.id === overId);
    
    if (!activeProspect || !overProspect) return;

    // Skip if dragging over itself
    if (activeId === overId) return;

    // Handle moving between columns
    if (activeProspect.status !== overProspect.status) {
      setLocalProspects(prospects => {
        const activeItems = getColumnProspects(prospects, activeProspect.status);
        const overItems = getColumnProspects(prospects, overProspect.status);

        const activeIndex = activeItems.findIndex(item => item.id === activeId);
        const overIndex = overItems.findIndex(item => item.id === overId);

        // Create new arrays
        const newOverItems = [...overItems];
        newOverItems.splice(overIndex, 0, { ...activeProspect, status: overProspect.status });

        // Calculate new position
        const prevCard = newOverItems[overIndex - 1];
        const nextCard = newOverItems[overIndex + 1];
        const newPosition = calculatePosition(
          prevCard?.position || null,
          nextCard?.position || null
        );

        // Update the moved card
        return prospects.map(prospect => {
          if (prospect.id === activeId) {
            return {
              ...prospect,
              status: overProspect.status,
              position: newPosition,
            };
          }
          return prospect;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProspect = localProspects.find(p => p.id === activeId);
    const overProspect = localProspects.find(p => p.id === overId);
    
    if (!activeProspect || !overProspect) return;

    // Skip if dropped on itself
    if (activeId === overId) return;

    // Get the current state before update for rollback
    const previousProspects = [...localProspects];

    // Handle both same column and different column moves
    const activeItems = getColumnProspects(localProspects, activeProspect.status);
    const overItems = getColumnProspects(localProspects, overProspect.status);

    const activeIndex = activeItems.findIndex(item => item.id === activeId);
    const overIndex = overItems.findIndex(item => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Calculate new position
    let newItems;
    if (activeProspect.status === overProspect.status) {
      // Same column - use arrayMove
      newItems = arrayMove(activeItems, activeIndex, overIndex);
    } else {
      // Different column - splice into new position
      newItems = [...overItems];
      newItems.splice(overIndex, 0, { ...activeProspect, status: overProspect.status });
    }

    const prevCard = newItems[overIndex - 1];
    const nextCard = newItems[overIndex + 1];
    const newPosition = calculatePosition(
      prevCard?.position || null,
      nextCard?.position || null
    );

    // Update local state immediately
    setLocalProspects(prospects => 
      prospects.map(prospect => {
        if (prospect.id === activeId) {
          return {
            ...prospect,
            status: overProspect.status,
            position: newPosition,
          };
        }
        return prospect;
      })
    );

    // Persist the change
    updateProspectMutation.mutate(
      {
        cardId: activeId,
        targetStatus: overProspect.status,
        newPosition,
      },
      {
        onError: () => {
          // Revert to previous state on error
          setLocalProspects(previousProspects);
        },
      }
    );
  };

  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="flex gap-4 h-full">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            prospects={getColumnProspects(localProspects, status)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <KanbanCard
            prospect={localProspects.find(p => p.id === activeId)!}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}