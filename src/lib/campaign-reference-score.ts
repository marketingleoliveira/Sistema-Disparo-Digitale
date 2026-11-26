type CampaignMask = {
  id: string;
  name: string;
  target: number;
  delivered: number;
  readings: number;
  clicks: number;
};

type RankedCampaign = CampaignMask & {
  deliveryRate: number;
  readingRate: number;
  clickRate: number;
  score: number;
};

export function getScore(campaign: CampaignMask): RankedCampaign {
  const deliveryRate = campaign.target > 0
    ? (campaign.delivered / campaign.target) * 100
    : 0;

  const readingRate = campaign.delivered > 0
    ? (campaign.readings / campaign.delivered) * 100
    : 0;

  const clickRate = campaign.readings > 0
    ? (campaign.clicks / campaign.readings) * 100
    : 0;

  const score =
    deliveryRate * 0.35 +
    readingRate * 0.45 +
    clickRate * 0.20;

  return {
    ...campaign,
    deliveryRate,
    readingRate,
    clickRate,
    score,
  };
}


export function rankReferenceCampaigns<T extends CampaignMask>(items: readonly T[]) {
  return items.map(item => ({ ...item, ...getScore(item) })).sort((a,b) => b.score-a.score).map((item,index) => ({ ...item, rank:index+1 }));
}
