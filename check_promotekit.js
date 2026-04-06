const https = require('https');

const options = {
  hostname: 'www.promotekit.com',
  path: '/api/v1/referrals?limit=100',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer pk_7fgiE9xvZRZiQusxvYujJM'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const matches = json.data.filter(r => r.email === 'birdwrk86@gmail.com');
    console.log("Referral data:", JSON.stringify(matches, null, 2));
  });
}).on('error', console.error);

const optionsComms = {
    hostname: 'www.promotekit.com',
    path: '/api/v1/commissions?limit=100',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer pk_7fgiE9xvZRZiQusxvYujJM'
    }
  };
  
  https.get(optionsComms, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      // We don't have customer_email on commission immediately in some APIs, let's just dump all where referral has this email
      const matches = json.data.filter(r => r.referral?.email === 'birdwrk86@gmail.com' || r.customer_email === 'birdwrk86@gmail.com');
      console.log("Commissions data:", JSON.stringify(matches, null, 2));
    });
  }).on('error', console.error);
