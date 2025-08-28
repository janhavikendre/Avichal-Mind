"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-9 w-9 rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
    >
      <motion.div
        initial={false}
        animate={{
          scale: [1, 1.2, 1],
          rotate: theme === "dark" ? [0, 180, 180] : [180, 0, 0],
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="flex items-center justify-center"
      >
        {theme === "light" ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-blue-400" />
        )}
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
