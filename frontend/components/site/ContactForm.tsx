'use client';

import { useState } from 'react';
import { SITE } from '@/lib/site';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lines = [
      `Hi Apex Martial Arts, I'm ${name || 'a prospective member'}.`,
      message,
      phone ? `You can reach me at ${phone}.` : '',
    ].filter(Boolean);
    const text = lines.join('\n\n');
    const url = `https://wa.me/${SITE.phoneIntl}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-headline mb-1">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2 bg-input border border-input rounded-[2px] focus:outline-none focus:border-white form-input-mobile"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-headline mb-1">
          Phone <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+20 ..."
          className="w-full px-3 py-2 bg-input border border-input rounded-[2px] focus:outline-none focus:border-white form-input-mobile"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-headline mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you're looking for — a program, a package, a question."
          className="w-full px-3 py-2 bg-input border border-input rounded-[2px] focus:outline-none focus:border-white form-input-mobile resize-none"
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Send via WhatsApp
      </button>
    </form>
  );
}
