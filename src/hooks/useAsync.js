import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  })

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      setData(result)
    } catch (e) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((e) => {
        if (active) setError(e?.message || 'Something went wrong')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload, setData }
}
