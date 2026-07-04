const fetcher = async <JSON>(url: string): Promise<JSON> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return await res.json();
};

export { fetcher };