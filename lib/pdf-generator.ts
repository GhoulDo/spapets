// Interfaces para los datos de la factura
interface ClienteFactura {
  nombre?: string;
  username?: string;
  email?: string;
  direccion?: string;
}

interface ProductoFactura {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface DatosFactura {
  numero?: string | number;
  fecha: string;
  cliente: ClienteFactura;
  productos: ProductoFactura[];
  total: number;
  metodoPago: string;
  direccionEntrega?: string;
}

// Función para generar una factura como PDF usando la API de impresión del navegador
export const generateInvoicePDF = async (datosFactura: DatosFactura): Promise<void> => {
  // Crear un iframe oculto para contener el documento de la factura
  const iframe = document.createElement('iframe');
  iframe.style.visibility = 'hidden';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  document.body.appendChild(iframe);
  
  // Formatear la fecha para mostrarla en la factura
  const fechaFormateada = new Date(datosFactura.fecha).toLocaleDateString('es-ES');
  
  // Generar el contenido HTML de la factura
  const facturaHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura ${datosFactura.numero || ''}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .factura {
          max-width: 800px;
          margin: 0 auto;
        }
        .cabecera {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
        }
        .logo h1 {
          color: #4CAF50;
          margin: 0;
        }
        .info-factura {
          text-align: right;
        }
        .cliente {
          margin-bottom: 20px;
        }
        h3 {
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          color: #4CAF50;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        thead tr {
          background-color: #f2f2f2;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th:last-child, td:last-child {
          text-align: right;
        }
        .total {
          margin-top: 20px;
          text-align: right;
        }
        .total span {
          font-weight: bold;
          font-size: 1.2em;
        }
        .pago {
          margin-top: 30px;
        }
        .nota {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="factura">
        <div class="cabecera">
          <div class="logo">
            <h1>PetGroomer</h1>
            <p>Peluquería y Cuidado Canino</p>
            <p>NIF: B-12345678</p>
            <p>Calle Principal 123, Ciudad</p>
          </div>
          <div class="info-factura">
            <h2>FACTURA</h2>
            <p style="font-size: 18px; font-weight: bold;">Nº ${datosFactura.numero || 'N/A'}</p>
            <p>Fecha: ${fechaFormateada}</p>
          </div>
        </div>

        <div class="cliente">
          <h3>Datos del Cliente</h3>
          <p><strong>Cliente:</strong> ${datosFactura.cliente.nombre || datosFactura.cliente.username || 'N/A'}</p>
          <p><strong>Email:</strong> ${datosFactura.cliente.email || 'N/A'}</p>
          ${datosFactura.direccionEntrega ? `<p><strong>Dirección de entrega:</strong> ${datosFactura.direccionEntrega}</p>` : ''}
        </div>

        <div class="productos">
          <h3>Detalles de la Compra</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${datosFactura.productos.map(producto => `
                <tr>
                  <td>${producto.nombre}</td>
                  <td>${producto.cantidad}</td>
                  <td>$${producto.precioUnitario.toFixed(2)}</td>
                  <td>$${producto.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total: <span>$${datosFactura.total.toFixed(2)}</span></p>
          </div>
        </div>

        <div class="pago">
          <h3>Información de Pago</h3>
          <p><strong>Método de pago:</strong> ${datosFactura.metodoPago}</p>
          <p><strong>Estado:</strong> PAGADO</p>
        </div>

        <div class="nota">
          <p>Gracias por su compra</p>
          <p>Para cualquier consulta contacte con nosotros en info@petgroomer.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Escribir el contenido HTML en el iframe
  if (iframe.contentWindow) {
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(facturaHtml);
    iframe.contentWindow.document.close();
    
    // Esperar a que se cargue el documento
    setTimeout(() => {
      try {
        // Imprimir el iframe como PDF
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        
        // Eliminar el iframe después de un tiempo
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
        
        console.log("PDF de factura generado correctamente usando la API de impresión");
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        document.body.removeChild(iframe);
      }
    }, 500);
  }
};

// Función mejorada para generar PDF con opción para descarga directa
export const printInvoice = (datosFactura: DatosFactura, downloadDirectly = true): void => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes para imprimir la factura');
    return;
  }

  // Formatear la fecha para mostrarla en la factura
  const fechaFormateada = new Date(datosFactura.fecha).toLocaleDateString('es-ES');
  
  // Generar un nombre de archivo para la descarga
  const fileName = `factura-${datosFactura.numero || new Date().getTime()}.pdf`;
  
  // Generar el contenido HTML de la factura
  const facturaHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura ${datosFactura.numero || ''}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .factura {
          max-width: 800px;
          margin: 0 auto;
        }
        .cabecera {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 20px;
        }
        .logo h1 {
          color: #4CAF50;
          margin: 0;
        }
        .info-factura {
          text-align: right;
        }
        .cliente {
          margin-bottom: 20px;
        }
        h3 {
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          color: #4CAF50;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        thead tr {
          background-color: #f2f2f2;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th:last-child, td:last-child {
          text-align: right;
        }
        .total {
          margin-top: 20px;
          text-align: right;
        }
        .total span {
          font-weight: bold;
          font-size: 1.2em;
        }
        .pago {
          margin-top: 30px;
        }
        .nota {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        .no-print {
          display: none;
        }
        @media screen {
          .download-message {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            text-align: center;
          }
          .download-button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            text-align: center;
            text-decoration: none;
            font-size: 14px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            margin-top: 10px;
          }
          .download-button:hover {
            background-color: #45a049;
          }
        }
      </style>
    </head>
    <body>
      <div class="download-message no-print">
        <p>La ventana de impresión se abrirá automáticamente para guardar o imprimir esta factura.</p>
        <p>Si no se abre automáticamente, puedes usar el botón de impresión de tu navegador.</p>
        <button class="download-button" onclick="window.print()">Imprimir/Guardar PDF</button>
      </div>
      
      <div class="factura">
        <div class="cabecera">
          <div class="logo">
            <h1>PetGroomer</h1>
            <p>Peluquería y Cuidado Canino</p>
            <p>NIF: B-12345678</p>
            <p>Calle Principal 123, Ciudad</p>
          </div>
          <div class="info-factura">
            <h2>FACTURA</h2>
            <p style="font-size: 18px; font-weight: bold;">Nº ${datosFactura.numero || 'N/A'}</p>
            <p>Fecha: ${fechaFormateada}</p>
          </div>
        </div>

        <div class="cliente">
          <h3>Datos del Cliente</h3>
          <p><strong>Cliente:</strong> ${datosFactura.cliente.nombre || datosFactura.cliente.username || 'N/A'}</p>
          <p><strong>Email:</strong> ${datosFactura.cliente.email || 'N/A'}</p>
          ${datosFactura.direccionEntrega ? `<p><strong>Dirección de entrega:</strong> ${datosFactura.direccionEntrega}</p>` : ''}
        </div>

        <div class="productos">
          <h3>Detalles de la Compra</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${datosFactura.productos.map(producto => `
                <tr>
                  <td>${producto.nombre}</td>
                  <td>${producto.cantidad}</td>
                  <td>$${producto.precioUnitario.toFixed(2)}</td>
                  <td>$${producto.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total: <span>$${datosFactura.total.toFixed(2)}</span></p>
          </div>
        </div>

        <div class="pago">
          <h3>Información de Pago</h3>
          <p><strong>Método de pago:</strong> ${datosFactura.metodoPago}</p>
          <p><strong>Estado:</strong> PAGADO</p>
        </div>

        <div class="nota">
          <p>Gracias por su compra</p>
          <p>Para cualquier consulta contacte con nosotros en info@petgroomer.com</p>
        </div>
      </div>
      
      <script>
        // Función para configurar el nombre del archivo al guardar como PDF
        function setupBeforePrint() {
          const style = document.createElement('style');
          style.type = 'text/css';
          style.media = 'print';
          document.head.appendChild(style);
          
          document.title = "${fileName.replace('.pdf', '')}";
          
          // En algunos navegadores, ocultar elementos no imprimibles
          var nonPrintable = document.querySelectorAll('.no-print');
          for (var i = 0; i < nonPrintable.length; i++) {
            nonPrintable[i].style.display = 'none';
          }
        }
        
        // Imprimir automáticamente cuando se carga la página
        window.onload = function() {
          setupBeforePrint();
          
          setTimeout(() => {
            window.print();
            ${downloadDirectly ? `
            // Si el usuario cancela la impresión o el guardado, aún tendrá
            // la posibilidad de hacerlo manualmente con el botón
            ` : ''}
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;

  // Escribir el contenido en la ventana emergente
  printWindow.document.open();
  printWindow.document.write(facturaHtml);
  printWindow.document.close();
};
