export function formatDateDay(dateString: string): string {
  const date = new Date(dateString);

  // Array nama hari dan bulan
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Ambil komponen tanggal
  const dayName = days[date.getUTCDay()]; // Nama hari
  const day = String(date.getUTCDate()).padStart(2, "0"); // Tanggal (2 digit)
  const month = months[date.getUTCMonth()]; // Nama bulan
  const year = date.getUTCFullYear(); // Tahun
  const hours = String(date.getUTCHours()).padStart(2, "0"); // Jam (2 digit)
  const minutes = String(date.getUTCMinutes()).padStart(2, "0"); // Menit (2 digit)
  const seconds = String(date.getUTCSeconds()).padStart(2, "0"); // Detik (2 digit)

  // Gabungkan menjadi format yang diinginkan
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

// Format dari yyyy-MM-dd ke yyyy-MM-dd'T'HH:mm:ss.SSSxxx dengan menitnya 00
export function formatDateStart(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Bulan (1-12)
  const day = String(date.getUTCDate()).padStart(2, "0"); // Tanggal (1-31)
  const hours = "00"; // Jam (selalu 00)
  const minutes = "00"; // Menit (selalu 00)
  const seconds = "00"; // Detik (selalu 00)
  const milliseconds = "000"; // Milidetik (selalu 000)
  const timezoneOffset = "+00:00"; // Offset waktu UTC

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;
}

export function formatDateEnd(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Bulan (1-12)
  const day = String(date.getUTCDate()).padStart(2, "0"); // Tanggal (1-31)
  const hours = "23"; // Jam (selalu 23)
  const minutes = "59"; // Menit (selalu 59)
  const seconds = "59"; // Detik (selalu 59)
  const milliseconds = "999"; // Milidetik (selalu 999)
  const timezoneOffset = "+00:00"; // Offset waktu UTC

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;
}

export function formatDateOnly(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Bulan (1-12)
  const day = String(date.getUTCDate()).padStart(2, "0"); // Tanggal (1-31)

  return `${year}-${month}-${day}`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Bulan (1-12)
  const day = String(date.getUTCDate()).padStart(2, "0"); // Tanggal (1-31)
  const hours = String(date.getUTCHours()).padStart(2, "0"); // Jam (2 digit)
  const minutes = String(date.getUTCMinutes()).padStart(2, "0"); // Menit (2 digit)
  const seconds = String(date.getUTCSeconds()).padStart(2, "0"); // Detik (2 digit)

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
