const nock = require('nock');

const mockPaymentGateway = () => {
  nock('https://api.stripe.com')
    .persist()
    .post('/v1/charges')
    .reply(200, { id: 'charge_id', status: 'succeeded' });

  nock('https://api.paypal.com')
    .persist()
    .post('/v1/payments/payment')
    .reply(200, { id: 'payment_id', state: 'approved' });
};

const mockLogisticsProvider = () => {
  nock('https://api.logistics.com')
    .persist()
    .post('/v1/shipments')
    .reply(200, { id: 'shipment_id', status: 'created' });
};

const mockDomainRegistration = () => {
  nock('https://api.domain.com')
    .persist()
    .post('/v1/domains')
    .reply(200, { id: 'domain_id', status: 'registered' });
};

module.exports = {
  mockPaymentGateway,
  mockLogisticsProvider,
  mockDomainRegistration,
};
