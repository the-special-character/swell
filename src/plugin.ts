import { registerCommercePlugin } from '@builder.io/commerce-plugin-tools';
import axios from 'axios';
// import swell from 'swell-js';

registerCommercePlugin(
  {
    name: 'Medusa',
    // should always match package.json package name
    id: '@builder.io/plugin-medusa',
    settings: [
      {
        name: 'publishableAPIKey',
        type: 'string',
        required: true,
        helperText: 'Get your Publishable Api Key from Medusa Admin Panel',
      },
      {
        name: 'adminURL',
        type: 'string',
        required: true,
        helperText: 'Get your Admin URL from Medusa store',
      },
    ],
    ctaText: `Connect your Medusa store`,
  },
  async settings => {
    const storeId = settings.get('publishableAPIKey')?.trim();
    const adminURL = settings.get('adminURL')?.trim();

    const transformResource = (resource: any) => ({
      id: resource.id,
      title: resource.title || resource.name,
      handle: resource.handle,
      ...(resource.images && {
        image: {
          src: resource.images[0]?.url,
        },
      }),
    });

    const axiosInstance = axios.create({
      baseURL: adminURL,
      timeout: 5000,
      timeoutErrorMessage: 'Please Try After Sometime',
      headers: {
        'x-publishable-api-key': storeId,
      },
    });

    return {
      product: {
        async findById(id: string) {
          const res = await axiosInstance.get(`/store/products/${id}`);
          return transformResource(res.data);
        },
        async findByHandle(handle: string) {
          let params: any = {};
          if (handle) params['handle'] = handle;
          const res = await axiosInstance.get('/store/products', {
            params,
          });
          return transformResource(res.data.products[0]);
        },
        async search(q: string) {
          let params: any = {};
          if (q) params['q'] = q;
          const res = await axiosInstance.get('/store/products', {
            params,
          });
          return res.data.products.map(transformResource);
        },

        getRequestObject(id: string) {
          return {
            '@type': '@builder.io/core:Request' as const,
            request: {
              // https://{public_key}@{client_id}.swell.store/api/products/5e31e67be53f9a59d89600f1.
              url: new URL(`/store/products/${id}`, adminURL).href,
              headers: {
                'x-publishable-api-key': storeId,
              },
            },
            options: {
              product: id,
            },
          };
        },
      },
      category: {
        async findById(id: string) {
          const res = await axiosInstance.get(`/store/product-categories/${id}`);
          return transformResource(res.data);
        },
        async findByHandle(handle: string) {
          let params: any = {};
          if (handle) params['handle'] = handle;
          const res = await axiosInstance.get('/store/product-categories', {
            params,
          });

          return transformResource(res.data.product_categories[0]);
        },
        async search(q: string) {
          let params: any = {};
          if (q) params['q'] = q;
          const res = await axiosInstance.get('/store/product-categories', {
            params,
          });
          return res.data.product_categories.map(transformResource);
        },
        getRequestObject(id: string) {
          return {
            '@type': '@builder.io/core:Request' as const,
            request: {
              // https://{public_key}@{client_id}.swell.store/api/categories/5e31e67be53f9a59d89600f1.
              url: new URL(`/store/product-categories/${id}`, adminURL).href,
            },
            options: {
              category: id,
            },
          };
        },
      },
    };
  }
);
