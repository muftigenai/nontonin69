const PublicPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Halaman Publik</h1>
        <p className="text-muted-foreground">
          Konten di halaman ini dapat diakses oleh publik.
        </p>
      </div>
      <div className="rounded-lg border p-8 text-center">
        <p>Ini adalah halaman publik Anda.</p>
      </div>
    </div>
  );
};

export default PublicPage;