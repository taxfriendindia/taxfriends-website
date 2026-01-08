import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { motion } from 'framer-motion'

const ThemeToggle = () => {
    const { isDarkMode, toggleDarkMode } = useTheme()

    return (
        <motion.button
            onClick={toggleDarkMode}
            className="relative p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 border border-indigo-100/50 dark:border-indigo-800 shadow-sm hover:shadow-md group"
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle dark mode"
        >
            <div className="relative w-5 h-5">
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDarkMode ? 0 : 1,
                        rotate: isDarkMode ? 180 : 0,
                        opacity: isDarkMode ? 0 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                >
                    <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDarkMode ? 1 : 0,
                        rotate: isDarkMode ? 0 : -180,
                        opacity: isDarkMode ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                >
                    <Moon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </motion.div>
            </div>
        </motion.button>
    )
}

export default ThemeToggle
