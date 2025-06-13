"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/navbar/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { DefaultSession } from "next-auth";
import { UserIcon, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarProfileProps {
  user: DefaultSession["user"];
}

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const AvatarProfile = ({ user }: AvatarProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className="cursor-pointer focus:outline-none"
        asChild
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Avatar className="h-8 w-8 border-2 border-primary-500 overflow-hidden">
            <AvatarImage
              src={user?.image ?? "/user-placeholder.jpg"}
              alt={user?.name ?? "User Avatar"}
            />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
            <motion.div
              className="absolute inset-0 w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%, transparent)",
                backgroundSize: "200% 100%",
              }}
              animate={{
                backgroundPosition: ["200% 0", "-200% 0"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </Avatar>
        </motion.div>
      </DropdownMenuTrigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-56 mt-2 p-0 overflow-hidden"
            asChild
            forceMount
          >
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DropdownMenuLabel className="font-normal p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none opacity-75">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="p-2"
              >
                <LogoutButton>
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 rounded-md">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </LogoutButton>
              </motion.div>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};
