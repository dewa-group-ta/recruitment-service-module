export function getHrToken(): string {
  const token = process.env.HR_TEST_TOKEN;
  if (!token) {
    throw new Error(
      'HR_TEST_TOKEN belum di-set. Tambahkan ke .env.test, mis:\n' +
      'HR_TEST_TOKEN=805dcf99-dcce-476b-a4c0-9dd674ec7fa4',
    );
  }
  return token;
}