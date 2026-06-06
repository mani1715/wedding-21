import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AddToCalendarButton
 * Surfaces the existing /api/invite/{slug}/calendar ICS endpoint as a prominent CTA.
 * The browser downloads a .ics file the guest can open in Apple / Google / Outlook.
 */
const AddToCalendarButton = ({ slug, label = 'Add to Calendar', subtle = false }) => {
  const href = `${API_URL}/api/invite/${slug}/calendar`;
  return (
    <motion.a
      href={href}
      data-testid="add-to-calendar-btn"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={subtle ? 'lux-btn lux-btn-ghost inline-flex items-center gap-2' : 'lux-btn inline-flex items-center gap-2'}
      style={{ borderRadius: '999px' }}
    >
      <Calendar className="w-4 h-4" />
      <span className="text-sm tracking-wide">{label}</span>
      <Plus className="w-3.5 h-3.5 opacity-80" />
    </motion.a>
  );
};

export default AddToCalendarButton;
