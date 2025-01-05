<script lang="ts">
 import { page } from "$app/state";
 import { goto } from "$app/navigation";
 import * as RobloxAPITypes from "$lib/roblox-api.types";
 import { onMount } from "svelte";

 const url = new URL(page.url);

 let userId = $state<number>();
 let assetType = $state<keyof typeof RobloxAPITypes.AssetTypeEnum>("PASS");

 let inventoryInfo = $derived.by(async () => {
  const response = await fetch(
   `https://www.roproxy.com/users/inventory/list-json?assetTypeId=${RobloxAPITypes.AssetTypeEnum[assetType]}&cursor=&itemsPerPage=1000&pageNumber=1&userId=${userId}`
  );
  return (await response.json()) as RobloxAPITypes.InventoryAPIResponse;
 });

 let userInfo = $derived.by(async () => {
  const response = await fetch(`https://users.roproxy.com/v1/users/${userId}`);
  return (await response.json()) as RobloxAPITypes.UserAPIResponse;
 });

 let avatarInfo = $derived.by(async () => {
  const response = await fetch(
   `https://thumbnails.roproxy.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
  );
  return (await response.json()) as RobloxAPITypes.ThumnailAPIResponse;
 });

 let currentFilters = $state({
  productName: "",
  productPrice: { min: 0, max: Infinity },
  creatorName: "",
 });

 type FiltersType = typeof currentFilters;

 type FiltersKeyType = keyof FiltersType;

 type FiltersFnType = Array<{
  name: FiltersKeyType;
  type: "range" | "condition";
  fn: (element: RobloxAPITypes.ItemElement) => boolean;
 }>;

 const filters: FiltersFnType = [
  {
   name: "productName",
   type: "range",
   fn: element =>
    !!currentFilters.productName
     ? element.Item.Name.toLowerCase().includes(currentFilters.productName.toLowerCase())
     : true,
  },
  {
   name: "productPrice",
   type: "range",
   fn: element =>
    element.Product.PriceInRobux >= currentFilters.productPrice.min &&
    element.Product.PriceInRobux <= currentFilters.productPrice.max,
  },
  {
   name: "creatorName",
   type: "range",
   fn: element =>
    !!currentFilters.creatorName
     ? element.Creator.Name.toLowerCase().includes(
        currentFilters.creatorName.toLowerCase()
       )
     : true,
  },
 ];

 function filterFn(element: RobloxAPITypes.ItemElement) {
  const metConditions: Array<boolean> = [];

  for (const [key] of Object.entries(currentFilters)) {
   currentFilters[key as FiltersKeyType]
    ? metConditions.push(
       filters.find(filter => filter.name == (key as FiltersKeyType))?.fn(element)!
      )
    : metConditions.push(true);
  }
  return metConditions.every(Boolean);
 }

 onMount(() => {
  const id = url.searchParams.get("id");

  if (id) {
   userId = +id;
  }
 });
</script>

<form
 onsubmit={event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const id = formData.get("id") as string;

  url.searchParams.set("id", id);

  // Update search paramaters for sharing URL
  goto(url.toString(), {
   replaceState: false,
   keepFocus: true,
  });

  userId = +id;
 }}
>
 <input name="id" type="number" placeholder="User ID" value={userId} />
 <select name="asset-type" bind:value={assetType}>
  {#each Object.entries(RobloxAPITypes.AssetTypeEnum) as [value]}
   <option {value}>
    {value}
   </option>
  {/each}
 </select>
 <button type="submit">Goto</button>
</form>

<div>
 {#each filters as { name, type }}
  {#if type == "condition"}
   <input
    type="checkbox"
    {name}
    checked={currentFilters[name] as unknown as boolean}
    onchange={() =>
     (currentFilters = { ...currentFilters, [name]: !currentFilters[name] })}
   />
   <label for={name}>{name}</label>
  {/if}
 {/each}
 <div class="flex flex-col w-40 space-y-2">
  <input
   type="text"
   placeholder="Product Name"
   oninput={event => {
    currentFilters = {
     ...currentFilters,
     productName: event.currentTarget.value,
    };
   }}
  />
  <input
   type="text"
   placeholder="Creator Name"
   oninput={event => {
    currentFilters = {
     ...currentFilters,
     creatorName: event.currentTarget.value,
    };
   }}
  />
  <input
   type="number"
   placeholder="Min"
   oninput={event => {
    currentFilters = {
     ...currentFilters,
     productPrice: {
      min: +event.currentTarget.value,
      max: currentFilters.productPrice.max,
     },
    };
   }}
  />
  <input
   type="number"
   placeholder="Max"
   oninput={event => {
    currentFilters = {
     ...currentFilters,
     productPrice: {
      min: currentFilters.productPrice.min,
      max: +event.currentTarget.value || Infinity,
     },
    };
   }}
  />
 </div>
</div>

{#if userId}
 {#await Promise.all([inventoryInfo, userInfo, avatarInfo])}
  <p>Loading</p>
 {:then [inventory, user, avatar]}
  <h1>{user.name}({user.displayName})</h1>
  <img
   src={avatar.data[0].imageUrl}
   alt={`${user.name}'s avatar`}
   width={300}
   height={300}
  />
  <ul>
   <li>
    Robux Spent
    <span>
     {inventory.Data.Items.reduce((sum, item) => {
      if (item.Creator.Id == userId) return sum;
      return sum + (item.Product.PriceInRobux || 0);
     }, 0)}
    </span>
   </li>
   <li>
    Total Bought:
    <span>
     {inventory.Data.Items.reduce((sum, item) => {
      if (item.Creator.Id == userId) return sum;
      return sum + 1;
     }, 0)}
    </span>
   </li>
  </ul>
  <ul class="flex flex-wrap gap-2">
   {#each inventory.Data.Items.filter(({ Creator }) => Creator.Id != userId) as Element}
    {@const { Item, Product, Thumbnail, Creator } = Element}
    <li class="max-w-[150px]" class:hidden={!filterFn(Element)}>
     <div>
      <a href={Item.AbsoluteUrl} rel="noopener noreferrer">
       <img
        src={Thumbnail.Url.replace(/110/g, "150")}
        alt={`${Item.Name}'s Thumbnail`}
        width={150}
        height={150}
       />
      </a>
     </div>
     <div>
      <div>
       <div title={Item.Name}>
        <a href={Item.AbsoluteUrl} rel="noopener noreferrer">
         {Item.Name}
        </a>
       </div>
       <div>
        <span>By:</span>
        <a
         class="font-semibold hover:underline"
         href={Creator.CreatorProfileLink}
         rel="noopener noreferrer"
        >
         {Creator.Name}
        </a>
       </div>
       <span
        >Price: {Product.IsFree
         ? "FREE"
         : !Product.IsForSale
           ? "Not for sale"
           : `${Product.PriceInRobux} Robux`}</span
       >
      </div>
     </div>
    </li>
   {/each}
  </ul>
 {:catch error}
  <p>An error occured!</p>
  <pre>{error}</pre>
 {/await}
{:else}
 <p>No user ID</p>
{/if}
