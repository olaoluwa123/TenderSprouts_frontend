import { useState } from 'react'
import { admissionEnquiriesApi } from '@/api'

const initialValues = {
  firstName: '',
  surname: '',
  email: '',
  phone: '',
  childAge: '',
  message: '',
}

const fieldClass =
  'w-full rounded-xl border border-blossom-100 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-blossom-300 focus:ring-2 focus:ring-blossom-100'

function Field({ label, name, type = 'text', required, value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
        {label}
        {required ? <span className="text-blossom"> *</span> : null}
      </span>
      <input
        className={fieldClass}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  )
}

export function EnquiryForm({ title = 'Send us an enquiry' }) {
  const [values, setValues] = useState(initialValues)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await admissionEnquiriesApi.create({
        firstName: values.firstName,
        surname: values.surname,
        email: values.email,
        phone: values.phone,
        childAgeOrClass: values.childAge,
        message: values.message,
      })
      setSent(true)
      setValues(initialValues)
    } catch (err) {
      setError(err?.message || 'Your enquiry could not be sent. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-blossom-500/10 ring-1 ring-blossom-200 sm:p-10">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink/60">
        Tell us a little about your child and we will get back to you within one working day.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" required value={values.firstName} onChange={update} placeholder="Aisha" />
        <Field label="Surname" name="surname" required value={values.surname} onChange={update} placeholder="Bello" />
        <Field
          label="Email address"
          name="email"
          type="email"
          required
          value={values.email}
          onChange={update}
          placeholder="you@example.com"
        />
        <Field label="Phone number" name="phone" type="tel" value={values.phone} onChange={update} placeholder="0803 000 0000" />
        <Field
          label="Child’s age or class of interest"
          name="childAge"
          value={values.childAge}
          onChange={update}
          placeholder="4 years — Nursery 1"
          className="sm:col-span-2"
        />

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
            Message<span className="text-blossom"> *</span>
          </span>
          <textarea
            className={`${fieldClass} min-h-32 resize-y`}
            name="message"
            required
            value={values.message}
            onChange={update}
            placeholder="I would like to arrange a school visit…"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 sm:w-auto"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
          {sent ? (
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Thank you. Your admission enquiry has been sent to the school administration.
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      </form>
    </div>
  )
}
