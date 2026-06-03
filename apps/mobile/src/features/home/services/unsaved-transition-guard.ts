type UnsavedTransitionInput = {
  selectedDhikrId: string;
  targetDhikrId?: string;
  unsavedProgressDhikrIds: string[];
  hasUnsavedFreeMode?: boolean;
  isLeavingFreeMode?: boolean;
};

export function shouldConfirmUnsavedDhikrTransition(input: UnsavedTransitionInput) {
  if (!input.selectedDhikrId) {
    return Boolean(input.hasUnsavedFreeMode && input.isLeavingFreeMode);
  }

  if (input.targetDhikrId && input.targetDhikrId === input.selectedDhikrId) {
    return false;
  }

  return input.unsavedProgressDhikrIds.includes(input.selectedDhikrId);
}
