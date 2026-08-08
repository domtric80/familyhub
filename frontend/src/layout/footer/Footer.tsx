export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 footer-copyright text-center">
            <p className="mb-0">Copyright {new Date().getFullYear()} &copy; FamilyHub &mdash; Tutti i diritti riservati</p>
            <p className="mb-0" style={{ fontSize: 12, color: '#8d8d8d' }}>
              <a href="https://domenicotricarico.it" target="_blank" rel="noopener noreferrer">Domenico Tricarico</a>
              {' per '}
              <a href="https://www.solosoluzioni.it" target="_blank" rel="noopener noreferrer">SoloSoluzioni</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
