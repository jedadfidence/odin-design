import { motion, AnimatePresence } from "framer-motion";
import ThreadHistory from "../thread/history";

interface MiniSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MiniSidebar({ open, onClose }: MiniSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-30 bg-black/20"
            onClick={onClose}
          />
          {/* Sidebar panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 z-40 w-64 border-r border-border bg-background shadow-lg"
          >
            <div className="flex h-10 items-center justify-between border-b border-border px-3">
              <span className="text-sm font-medium">History</span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
              <ThreadHistory collapsed={false} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
