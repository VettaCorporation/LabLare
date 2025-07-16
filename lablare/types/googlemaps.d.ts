// types/googlemaps.d.ts

// Isso estende a interface global Window para incluir a propriedade 'google'
// que será injetada pela Google Maps API.
declare global {
  interface Window {
    google: typeof google; // Declara que 'google' existe em 'window' e é do tipo 'google' (o namespace da API)
  }
}

// Declara o namespace 'google.maps' para que o TypeScript saiba sobre os objetos do Google Maps.
// Esta é uma declaração simplificada apenas para resolver o erro básico.
// Para tipagem completa, usaria pacotes como '@types/google.maps'.
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions): void;
      // Adicione outras propriedades/métodos conforme você usa (ex: getCenter, setZoom, etc.)
    }

    interface MapOptions {
      center: LatLngLiteral;
      zoom: number;
      // ... outras opções de mapa
    }

    class Marker {
      constructor(opts?: MarkerOptions): void;
    }

    interface MarkerOptions {
      position: LatLngLiteral;
      map: Map;
      title?: string;
      // ... outras opções de marcador
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    // Você pode adicionar mais classes e interfaces conforme for usando a API do Google Maps
    // Por exemplo:
    // class InfoWindow { ... }
    // class Polygon { ... }
    // class Polyline { ... }
    // class LatLng { ... }
  }
}

// Você também pode incluir tipagens para outros serviços do Google Maps, como 'places'
// declare namespace google {
//   namespace maps {
//     namespace places {
//       class Autocomplete { ... }
//     }
//   }
// }