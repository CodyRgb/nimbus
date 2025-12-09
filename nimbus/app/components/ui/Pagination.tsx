"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}: PaginationProps) {
    // Don't render if there's only one page or no pages
    if (totalPages <= 1) return null;

    // Calculate page numbers to display (current page ± 2)
    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show current page ± 2 pages
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            // Adjust if we're near the start or end
            if (currentPage <= 3) {
                endPage = maxPagesToShow;
            } else if (currentPage >= totalPages - 2) {
                startPage = totalPages - maxPagesToShow + 1;
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className={`flex justify-center items-center gap-2 ${className}`}>
            {/* Previous Button */}
            <motion.button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-4 py-2 glass-card border rounded-xl font-medium text-sm transition-all ${currentPage === 1
                        ? "border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50"
                        : "border-aurora-blue/30 text-aurora-blue hover:bg-aurora-blue/10"
                    }`}
                whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
            >
                ← Previous
            </motion.button>

            {/* Page Numbers */}
            <div className="flex gap-2">
                {/* First page if not in range */}
                {pageNumbers[0] > 1 && (
                    <>
                        <motion.button
                            onClick={() => onPageChange(1)}
                            className="px-3 py-2 glass-card border border-white/10 rounded-lg text-white hover:bg-white/5 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            1
                        </motion.button>
                        {pageNumbers[0] > 2 && (
                            <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                    </>
                )}

                {/* Page number buttons */}
                {pageNumbers.map((page) => (
                    <motion.button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 glass-card border rounded-lg font-medium transition-all ${page === currentPage
                                ? "border-aurora-blue bg-aurora-blue text-white"
                                : "border-white/10 text-white hover:bg-white/5"
                            }`}
                        whileHover={page !== currentPage ? { scale: 1.05 } : {}}
                        whileTap={page !== currentPage ? { scale: 0.95 } : {}}
                    >
                        {page}
                    </motion.button>
                ))}

                {/* Last page if not in range */}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                            <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                        <motion.button
                            onClick={() => onPageChange(totalPages)}
                            className="px-3 py-2 glass-card border border-white/10 rounded-lg text-white hover:bg-white/5 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {totalPages}
                        </motion.button>
                    </>
                )}
            </div>

            {/* Next Button */}
            <motion.button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 glass-card border rounded-xl font-medium text-sm transition-all ${currentPage === totalPages
                        ? "border-gray-500/30 text-gray-500 cursor-not-allowed opacity-50"
                        : "border-aurora-blue/30 text-aurora-blue hover:bg-aurora-blue/10"
                    }`}
                whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
            >
                Next →
            </motion.button>

            {/* Page info */}
            <div className="ml-4 text-sm text-gray-400 font-body">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
}
