"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Menu, Moon, Sun, ChevronRight } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onStartAnalysis: () => void;
}

export default function Navbar({ onStartAnalysis }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const menuModalRef = useRef<HTMLDivElement>(null);

  const popMenu = () => setOpenMenu((prev) => !prev);

  useEffect(() => {
    if (!openMenu) return;
    const removeModal = (e: MouseEvent) => {
      if (
        menuModalRef.current &&
        !menuModalRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("click", removeModal);
    return () => document.removeEventListener("click", removeModal);
  }, [openMenu]);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 ${openMenu ? "" : "sm:block"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="hidden md:block text-2xl font-bold text-teal-600">
                  DiaWatch
                </h1>
              </div>
            </Link>

            {/* desktop  */}
            <div className="items-center space-x-8 hidden sm:flex">
              <Link
                href="/"
                className="font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/history"
                className="font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                History
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-teal-400/20 hover:bg-teal-500/20 transition-colors dark:bg-sky-800/20 dark:hover:bg-sky-950/40"
              >
                {theme === "dark" ? (
                  <Sun className="text-white" />
                ) : (
                  <Moon className="text-teal-800" />
                )}
              </button>

              {/* auth  */}
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <button
                      onClick={logout}
                      className="font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                      >
                        Login
                      </Link>
                    </>
                  )}
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartAnalysis}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Start Analysis</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* mobile menu  */}
            <div
              className="sm:hidden bg-teal-500 p-2 rounded-lg cursor-pointer"
              onClick={popMenu}
            >
              <Menu className="text-white" />
            </div>
          </div>
        </div>
      </nav>

      {/* mobile munu */}
      {openMenu && (
        <div
          className="inset-0 fixed top-0 right-0 left-0 flex flex-col bg-white dark:bg-gray-900/80 backdrop-blur-xl z-50 h-fit border-b border-gray-200 dark:border-gray-800 sm:hidden"
          ref={menuModalRef}
        >
          <Link
            href="/"
            className="font-semibold text-gray-700 dark:text-gray-300 py-3 hover:text-teal-600 dark:hover:text-teal-400 transition-colors border-b-2 text-center hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
            onClick={popMenu}
          >
            Home
          </Link>
          <Link
            href="/history"
            className="font-semibold text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-3 border-b-2 text-center hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
            onClick={popMenu}
          >
            History
          </Link>

          {/* links for mobile auth */}
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    popMenu();
                  }}
                  className="font-semibold text-gray-700 dark:text-gray-300 py-3 border-b-2 text-center hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="font-semibold text-teal-600 dark:text-teal-400 py-3 border-b-2 text-center hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
                    onClick={popMenu}
                  >
                    Login
                  </Link>
                </>
              )}
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onStartAnalysis();
              popMenu();
            }}
            className="btn-primary flex items-center justify-center space-x-2 !rounded-none"
          >
            <span>Start Analysis</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <button
            onClick={() => {
              toggleTheme();
              popMenu();
            }}
            className="btn-secondary !rounded-t-none flex justify-center items-center"
          >
            {theme === "dark" ? <Sun /> : <Moon className="text-teal-600" />}
          </button>
        </div>
      )}
    </>
  );
}
