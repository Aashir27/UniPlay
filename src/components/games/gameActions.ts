type RouterLike = {
  push: (href: string) => void;
  refresh: () => void;
};

type GameActionDeps = {
  gameID: string;
  router: RouterLike;
  setError: (value: string | null) => void;
  setIsDeleting: (value: boolean) => void;
  setIsWithdrawing: (value: boolean) => void;
  setShowLeaveConfirm?: (value: boolean) => void;
  setShowDeleteConfirm?: (value: boolean) => void;
  onLeaveComplete?: (data: { gameDeleted: boolean }) => void;
  onDeleteComplete?: () => void;
};

export function createGameActionHandlers({
  gameID,
  router,
  setError,
  setIsDeleting,
  setIsWithdrawing,
  setShowLeaveConfirm,
  setShowDeleteConfirm,
  onLeaveComplete,
  onDeleteComplete,
}: GameActionDeps) {
  const handleLeave = async () => {
    setShowLeaveConfirm?.(false);
    setIsWithdrawing(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameID}/withdraw`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to leave game");
        return;
      }
      const data = await res.json();

      if (onLeaveComplete) {
        onLeaveComplete(data);
      } else if (data.gameDeleted) {
        router.push("/games");
        router.refresh();
      } else {
        router.push(`/games/${gameID}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm?.(false);
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameID}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete game");
        return;
      }
      if (onDeleteComplete) {
        onDeleteComplete();
      } else {
        router.push("/games");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDelete, handleLeave };
}
